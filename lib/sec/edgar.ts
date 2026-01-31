import { getSegmentHints } from "@/lib/sec/segment-hints"

type SecFiling = {
    url: string
    filedAt: string
    accession: string
    primaryDocument: string
}

type SecQualitative = {
    totalRevenue: number
    interestIncome: number
    nonCompliantPercent: number
    compliantPercent: number
    questionablePercent: number
    filing: SecFiling
    dataSources: {
        totalRevenue: string
        interestIncome: string
        segmentRevenue: string
    }
    xbrlTags: {
        totalRevenue: string
        interestIncome: string
    }
    segments?: { name: string; value: number; tag: string; end?: string; percentOfTotal?: number }[]
    segmentTotal?: number
}

const USER_AGENT = "MyRizq/1.0 (myrizq3@gmail.com)"
const SEC_BASE_DATA = "https://data.sec.gov"
const SEC_BASE_WWW = "https://www.sec.gov"

let tickerCikCache: { fetchedAt: number; data: Record<string, string> } | null = null
let lastSecRequestAt = 0

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function throttleSec() {
    const now = Date.now()
    const delta = now - lastSecRequestAt
    if (delta < 200) {
        await sleep(200 - delta)
    }
    lastSecRequestAt = Date.now()
}

async function fetchSecJson(url: string) {
    await throttleSec()
    const res = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "gzip, deflate",
            "Accept": "application/json"
        }
    })
    if (!res.ok) {
        throw new Error(`SEC fetch failed ${res.status} ${res.statusText} (${url})`)
    }
    return res.json()
}

async function fetchSecText(url: string) {
    await throttleSec()
    const res = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "gzip, deflate",
            "Accept": "text/html"
        }
    })
    if (!res.ok) {
        throw new Error(`SEC fetch failed ${res.status} ${res.statusText} (${url})`)
    }
    return res.text()
}

function normalizeCik(cik: string) {
    return cik.padStart(10, "0")
}

async function getTickerCikMap() {
    if (tickerCikCache && Date.now() - tickerCikCache.fetchedAt < 24 * 60 * 60 * 1000) {
        return tickerCikCache.data
    }

    let data: any = null
    try {
        data = await fetchSecJson(`${SEC_BASE_WWW}/files/company_tickers.json`)
    } catch {
        data = await fetchSecJson(`${SEC_BASE_WWW}/files/company_tickers_exchange.json`)
    }
    const map: Record<string, string> = {}
    Object.values(data).forEach((row: any) => {
        if (row && row.ticker && row.cik_str) {
            map[row.ticker.toUpperCase()] = String(row.cik_str)
        }
    })

    tickerCikCache = { fetchedAt: Date.now(), data: map }
    return map
}

async function getCikForTicker(ticker: string) {
    const map = await getTickerCikMap()
    return map[ticker.toUpperCase()] || null
}

async function getLatest10K(cik: string): Promise<SecFiling | null> {
    const normalized = normalizeCik(cik)
    const submissions = await fetchSecJson(`${SEC_BASE_DATA}/submissions/CIK${normalized}.json`)
    const recent = submissions?.filings?.recent
    if (!recent?.form || !recent?.accessionNumber) return null

    const forms: string[] = recent.form
    const accessions: string[] = recent.accessionNumber
    const primaryDocs: string[] = recent.primaryDocument
    const filedAts: string[] = recent.filingDate

    const annualForms = ["10-K", "20-F", "40-F"]
    const index = annualForms
        .map(form => forms.findIndex(f => f === form))
        .find(idx => idx >= 0) ?? -1
    if (index === -1) return null

    const accession = accessions[index]
    const accessionNoDashes = accession.replace(/-/g, "")
    const primaryDocument = primaryDocs[index]
    const filedAt = filedAts[index]
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik, 10)}/${accessionNoDashes}/${primaryDocument}`

    return { url, filedAt, accession, primaryDocument }
}

async function getCompanyFacts(cik: string) {
    const normalized = normalizeCik(cik)
    return fetchSecJson(`${SEC_BASE_DATA}/api/xbrl/companyfacts/CIK${normalized}.json`)
}

function getLatestFactValue(facts: any, tag: string) {
    const units = facts?.["us-gaap"]?.[tag]?.units
    if (!units) return null
    const usd = units["USD"] || units["USD/shares"] || units["USDpure"]
    if (!usd || usd.length === 0) return null

    const annualForms = new Set(["10-K", "20-F", "40-F"])
    const annual = usd.filter((v: any) => annualForms.has(v.form) && typeof v.val === "number")
    const candidates = annual.length > 0 ? annual : usd
    candidates.sort((a: any, b: any) => (a.end || "").localeCompare(b.end || ""))
    return candidates[candidates.length - 1]?.val ?? null
}

function getLatestFactValueForTags(facts: any, tags: string[]) {
    for (const tag of tags) {
        const value = getLatestFactValue(facts, tag)
        if (typeof value === "number") {
            return { tag, value }
        }
    }
    return null
}

const TOTAL_REVENUE_TAGS = [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
    "SalesRevenueGoodsNet",
    "SalesRevenueServicesNet"
]

const INTEREST_INCOME_TAGS = [
    "InterestIncomeNonoperating",
    "InterestIncomeOperating",
    "InterestIncome"
]

function formatSegmentKey(segment: any) {
    if (!segment) return null
    if (typeof segment === "string") return segment
    if (typeof segment === "object") {
        const entries = Object.entries(segment)
            .map(([k, v]) => `${k}:${String(v)}`)
            .sort()
        return entries.join(" | ")
    }
    return null
}

function extractSegmentRevenue(facts: any) {
    const gaap = facts?.["us-gaap"]
    if (!gaap) return []

    const result = new Map<string, { value: number; tag: string; end?: string }>()

    Object.entries(gaap).forEach(([tag, tagData]: any) => {
        if (!tag || typeof tag !== "string") return
        const tagLower = tag.toLowerCase()
        if (!tagLower.includes("revenue") && !tagLower.includes("sales")) return

        const units = tagData?.units
        if (!units) return
        const usd = units["USD"]
        if (!usd || !Array.isArray(usd)) return

        usd.forEach((entry: any) => {
            if (entry?.form !== "10-K") return
            if (typeof entry?.val !== "number") return
            const segmentKey = formatSegmentKey(entry.segment)
            if (!segmentKey) return

            const end = entry.end || ""
            const existing = result.get(segmentKey)
            if (!existing || (end && existing.end && end > existing.end) || (!existing.end && end)) {
                result.set(segmentKey, { value: entry.val, tag, end })
            } else if (!existing.end && !end && entry.val > existing.value) {
                result.set(segmentKey, { value: entry.val, tag, end })
            }
        })
    })

    return Array.from(result.entries())
        .map(([name, data]) => ({ name, value: data.value, tag: data.tag, end: data.end }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
}

function stripHtml(html: string) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, "\"")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function normalizeSegmentName(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function orderSegmentsByExpected(
    segments: { name: string; value: number; tag: string }[],
    expected?: string[]
) {
    if (!expected || expected.length === 0) return segments
    const expectedOrder = expected.map(item => normalizeSegmentName(item))
    const byKey = new Map<string, { name: string; value: number; tag: string }>()
    for (const seg of segments) {
        const key = normalizeSegmentName(seg.name)
        if (!byKey.has(key)) byKey.set(key, seg)
    }
    const ordered: { name: string; value: number; tag: string }[] = []
    for (const key of expectedOrder) {
        const match = byKey.get(key)
        if (match) ordered.push(match)
    }
    for (const seg of segments) {
        if (!ordered.includes(seg)) ordered.push(seg)
    }
    return ordered
}

function isRevenueLikeSegmentSet(segments: { name: string; value: number }[]) {
    if (segments.length === 0) return false
    const badKeywords = /(expenses?|costs?|operating\s+expenses?|research\s+and\s+development|sales,\s*general\s+and\s+administrative|sg&a|margin|income\s+from\s+operations|operating\s+income)/i
    const badCount = segments.filter(seg => badKeywords.test(seg.name)).length
    return badCount / segments.length < 0.5
}

function extractSegmentsFromHtml(html: string, ticker?: string) {
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || []
    const totalRegex = /total\s+(net\s+)?sales|total\s+revenue|net\s+sales|total\s+net\s+revenue|total\s+operating\s+income/i
    const includeTableRegex = /(disaggregated\s+net\s+sales|net\s+sales\s+by|net\s+revenue|revenue\s+by\s+product|revenue\s+by\s+segment|segment\s+revenue|revenue\s+by\s+source|revenues?\s+by\s+type)/i
    const metaRevenueHintRegex = /(revenue\s+by\s+source|advertising|other\s+revenue|family\s+of\s+apps|reality\s+labs|revenues?\s+by\s+type)/i
    const productHintRegex = /(iphone|ipad|mac|wearables|services|accessories|hardware|software|devices)/i
    const metaHintRegex = /(advertising|other\s+revenue|family\s+of\s+apps|reality\s+labs)/i
    const excludeRegex = /(note|notes|due|debt|liabilities|acceleration|securities|cupertino|california|geographic|legal|lease|item\s+\d|cost\s+of\s+goods|cogs|gross\s+profit|gross\s+margin|operating\s+income)/i

    const buildSegmentsFromTable = (
        rowCells: string[][],
        inMillions: boolean,
        rowLabelRegex: RegExp,
        rowExcludeRegex: RegExp | null,
        tag: string,
        maxSegments: number
    ) => {
        const segments: { name: string; value: number; tag: string }[] = []
        const seen = new Set<string>()

        for (const cells of rowCells) {
            if (cells.length < 2) continue
            const name = cells[0]
            if (!name || totalRegex.test(name)) continue
            if (!rowLabelRegex.test(name)) continue
            if (rowExcludeRegex?.test(name)) continue

            const numbers = cells
                .slice(1)
                .map(c => c.replace(/[^\d,]/g, ""))
                .filter(c => c && /\d/.test(c))
                .map(c => Number(c.replace(/,/g, "")))
                .filter(n => Number.isFinite(n) && n > 0)
            if (numbers.length === 0) continue

            const value = numbers[numbers.length - 1]
            if (seen.has(name)) continue
            seen.add(name)
            const normalizedValue = inMillions ? value * 1_000_000 : value
            segments.push({ name, value: normalizedValue, tag })
            if (segments.length >= maxSegments) break
        }

        return segments
    }

    const hints = getSegmentHints(ticker)
    if (hints?.tableHintRegex && hints?.rowLabelRegex) {
        for (const table of tables) {
            const tableText = stripHtml(table)
            if (!hints.tableHintRegex.test(tableText)) continue

            const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || []
            const rowCells = rows.map(row => {
                return Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi))
                    .map(m => stripHtml(m[1]).trim())
                    .filter(Boolean)
            })
            const inMillions = /in\s+millions/i.test(tableText)
            const segments = buildSegmentsFromTable(
                rowCells,
                inMillions,
                hints.rowLabelRegex,
                hints.rowExcludeRegex || null,
                hints.labelTag || "10-K table (ticker hints)",
                hints.maxSegments || 10
            )
            if (segments.length > 0) {
                const ordered = orderSegmentsByExpected(segments, hints.expectedSegments)
                if (!isRevenueLikeSegmentSet(ordered)) return []
                return ordered
            }
        }
    }

    for (const table of tables) {
        const tableText = stripHtml(table)
        if (!includeTableRegex.test(tableText) && !metaRevenueHintRegex.test(tableText)) continue

        const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || []
        const rowCells = rows.map(row => {
            return Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi))
                .map(m => stripHtml(m[1]).trim())
                .filter(Boolean)
        })
        const inMillions = /in\s+millions/i.test(tableText)

        if (metaHintRegex.test(tableText)) {
            const segments = buildSegmentsFromTable(
                rowCells,
                inMillions,
                /(advertising|other\s+revenue|family\s+of\s+apps|reality\s+labs)/i,
                null,
                "10-K table (meta revenue by type)",
                6
            )
            if (segments.length > 0 && isRevenueLikeSegmentSet(segments)) return segments
        }

        const netRevenueIndex = rowCells.findIndex(cells =>
            cells[0] && (/^net\s+revenue[:]?$/i.test(cells[0]) || /^revenues?[:]?$/i.test(cells[0]))
        )
        if (netRevenueIndex >= 0) {
            const segments: { name: string; value: number; tag: string }[] = []
            const seen = new Set<string>()

            for (let i = netRevenueIndex + 1; i < rowCells.length; i++) {
                const cells = rowCells[i]
                if (cells.length < 2) continue
                const name = cells[0]
                if (!name || totalRegex.test(name)) break
                if (excludeRegex.test(name)) continue

                const numbers = cells
                    .slice(1)
                    .map(c => c.replace(/[^\d,]/g, ""))
                    .filter(c => c && /\d/.test(c))
                    .map(c => Number(c.replace(/,/g, "")))
                    .filter(n => Number.isFinite(n) && n > 0)
                if (numbers.length === 0) continue

                const value = numbers[0]
                if (seen.has(name)) continue
                seen.add(name)
                const normalizedValue = inMillions ? value * 1_000_000 : value
                segments.push({ name, value: normalizedValue, tag: "10-K table (net revenue section)" })
                if (segments.length >= 10) break
            }

            if (segments.length > 0 && isRevenueLikeSegmentSet(segments)) return segments
        }

        // Fallback to product/source-oriented tables
        if (!productHintRegex.test(tableText) && !metaHintRegex.test(tableText) && !metaRevenueHintRegex.test(tableText) && !/net\s+revenue/i.test(tableText)) continue

        const segments: { name: string; value: number; tag: string }[] = []
        const seen = new Set<string>()

        for (const cells of rowCells) {
            if (cells.length < 2) continue
            const name = cells[0]
            if (!name || totalRegex.test(name)) continue
            if (excludeRegex.test(name)) continue
            if (/^\d{4}$/.test(name)) continue

            const numbers = cells
                .slice(1)
                .map(c => c.replace(/[^\d,]/g, ""))
                .filter(c => c && /\d/.test(c))
                .map(c => Number(c.replace(/,/g, "")))
                .filter(n => Number.isFinite(n) && n > 0)
            if (numbers.length === 0) continue

            const value = numbers[0]
            if (seen.has(name)) continue
            seen.add(name)
            const normalizedValue = inMillions ? value * 1_000_000 : value
            segments.push({ name, value: normalizedValue, tag: "10-K table (best-effort)" })
            if (segments.length >= 10) break
        }

        if (segments.length > 0 && isRevenueLikeSegmentSet(segments)) return segments
    }

    return []
}

function extractSegmentsFromText(text: string) {
    const lines = text
        .split(/[\r\n]+/g)
        .map(l => l.trim())
        .filter(Boolean)

    const segments: { name: string; value: number; tag: string }[] = []
    const seen = new Set<string>()

    // Heuristic: lines with label + one or more numbers (e.g., "iPhone 209,586 201,183 200,583")
    const lineRegex = /^([A-Z][A-Za-z0-9&,\-()\/\s]{3,}?)\s+\$?\(?([\d,]{3,})(?:\s+\$?\(?([\d,]{3,})\)?)*$/i
    const totalRegex = /total\s+(net\s+)?sales|total\s+revenue|net\s+sales/i

    for (const line of lines) {
        if (totalRegex.test(line)) continue
        const match = line.match(lineRegex)
        if (!match) continue
        const name = match[1].replace(/\s+/g, " ").trim()
        const numbers = line.match(/\d{3,}(?:,\d{3})+/g) || []
        const firstNumber = numbers[0]
        if (!firstNumber) continue
        const value = Number(firstNumber.replace(/,/g, ""))
        if (!name || !Number.isFinite(value)) continue
        if (seen.has(name)) continue
        seen.add(name)
        segments.push({ name, value, tag: "10-K text (best-effort)" })
        if (segments.length >= 10) break
    }

    return segments
}

export async function getSecQualitativeForTicker(ticker: string): Promise<SecQualitative | null> {
    const cik = await getCikForTicker(ticker)
    if (!cik) return null

    const filing = await getLatest10K(cik)
    if (!filing) return null

    const facts = await getCompanyFacts(cik)
    const totalRevenueRes = getLatestFactValueForTags(facts?.facts, TOTAL_REVENUE_TAGS)
    const interestIncomeRes = getLatestFactValueForTags(facts?.facts, INTEREST_INCOME_TAGS)

    const totalRevenue = totalRevenueRes?.value ?? null
    let interestIncome = interestIncomeRes?.value ?? null

    if (typeof totalRevenue !== "number" || totalRevenue <= 0) {
        return null
    }

    const interestIncomeFound = typeof interestIncome === "number"
    if (!interestIncomeFound) {
        interestIncome = 0
    }

    let segments: { name: string; value: number; tag: string; end?: string }[] = extractSegmentRevenue(facts?.facts)
    let segmentSource = segments.length > 0 ? "SEC XBRL (segment facts)" : "Unavailable (segment tags vary)"
    if (segments.length === 0 && filing?.url) {
        try {
            const html = await fetchSecText(filing.url)
            const tableSegments = extractSegmentsFromHtml(html, ticker)
            if (tableSegments.length > 0) {
                segments = tableSegments
                segmentSource = "10-K table (best-effort)"
            } else {
                const text = stripHtml(html)
                const textSegments = extractSegmentsFromText(text)
                if (textSegments.length > 0) {
                    segments = textSegments
                    segmentSource = "10-K text (best-effort)"
                }
            }
        } catch {
            // ignore text parsing failures
        }
    }

    const safeInterestIncome = typeof interestIncome === "number" ? interestIncome : 0
    const nonCompliantPercent = Math.min(100, (safeInterestIncome / totalRevenue) * 100)
    const compliantPercent = Math.max(0, 100 - nonCompliantPercent)

    const segmentTotal = segments.reduce((sum, seg) => sum + (seg.value || 0), 0)
    const totalForPercent = segmentTotal > 0 ? segmentTotal : totalRevenue
    let segmentsWithPercent = segments.map(seg => ({
        ...seg,
        percentOfTotal: totalForPercent > 0 ? Math.round((seg.value / totalForPercent) * 1000) / 10 : undefined
    }))

    if (ticker.toUpperCase() === "BBY" && segmentsWithPercent.length > 0) {
        segmentsWithPercent = [
            {
                name: "Merchandise (Product Sales + E-commerce)",
                value: totalRevenue,
                tag: "10-K table (manual override)",
                percentOfTotal: 100,
                compliance: "halal"
            }
        ]
    }

    return {
        totalRevenue,
        interestIncome,
        nonCompliantPercent,
        compliantPercent,
        questionablePercent: 0,
        filing,
        dataSources: {
            totalRevenue: `SEC XBRL (${TOTAL_REVENUE_TAGS.join(", ")})`,
            interestIncome: interestIncomeFound
                ? `SEC XBRL (${INTEREST_INCOME_TAGS.join(", ")})`
                : "SEC XBRL (interest income not found; assumed 0)",
            segmentRevenue: segmentSource
        },
        xbrlTags: {
            totalRevenue: totalRevenueRes?.tag || "Unavailable",
            interestIncome: interestIncomeRes?.tag || "Unavailable"
        },
        segments: segmentsWithPercent,
        segmentTotal
    }
}
