import { NextRequest, NextResponse } from "next/server"
import type { ETFHolding, SectorAllocation } from "@/lib/etf-data"

type HoldingsPayload = {
  ticker: string
  symbol: string
  holdings: ETFHolding[]
  sectors: SectorAllocation[]
  updatedAt: string
}

const holdingsCache: Record<string, { expiresAt: number; data: HoldingsPayload }> = {}
const HOLDINGS_CACHE_TTL_MS = 1000 * 60 * 60 * 24

async function getYahooFinance() {
  const { default: YahooFinance } = await import("yahoo-finance2")
  return new YahooFinance({ suppressNotices: ["yahooSurvey"] })
}

function normalizeWeight(value: number) {
  if (!Number.isFinite(value)) return 0
  return value <= 1 ? value * 100 : value
}

function normalizeSectorWeightings(raw: any): SectorAllocation[] {
  if (!Array.isArray(raw)) return []
  const sectors: SectorAllocation[] = []
  for (const entry of raw) {
    if (entry?.sector && typeof entry.weight === "number") {
      sectors.push({ sector: entry.sector, weight: normalizeWeight(entry.weight) })
      continue
    }
    if (entry && typeof entry === "object") {
      const keys = Object.keys(entry)
      if (keys.length === 1) {
        const sector = keys[0]
        const weight = normalizeWeight(Number(entry[sector]))
        if (Number.isFinite(weight)) sectors.push({ sector, weight })
      }
    }
  }
  return sectors
}

async function fetchHoldingsForSymbol(symbol: string): Promise<HoldingsPayload | null> {
  const yahooFinance = await getYahooFinance()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quoteSummary: any = await yahooFinance.quoteSummary(symbol, {
    modules: ["topHoldings", "fundProfile", "summaryDetail", "price"]
  })
  const topHoldings = quoteSummary?.topHoldings
  if (!topHoldings?.holdings || topHoldings.holdings.length === 0) return null

  const holdings: ETFHolding[] = topHoldings.holdings
    .map((holding: any) => {
      const ticker = holding?.symbol || holding?.ticker || ""
      const name = holding?.holdingName || holding?.name || ticker
      const weight = normalizeWeight(
        Number(holding?.holdingPercent ?? holding?.percent ?? holding?.weight ?? 0)
      )
      return { ticker, name, weight }
    })
    .filter((h: ETFHolding) => h.ticker && h.weight > 0)

  if (holdings.length === 0) return null

  const sectors = normalizeSectorWeightings(topHoldings?.sectorWeightings)

  return {
    ticker: symbol,
    symbol,
    holdings,
    sectors,
    updatedAt: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase()
  const listing = request.nextUrl.searchParams.get("listing")?.toUpperCase()
  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 })
  }

  const cacheKey = `${ticker}:${listing || ""}`
  const cached = holdingsCache[cacheKey]
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data)
  }

  const symbols = [ticker]
  if (listing === "UK") symbols.push(`${ticker}.L`)

  for (const symbol of symbols) {
    try {
      const data = await fetchHoldingsForSymbol(symbol)
      if (data) {
        holdingsCache[cacheKey] = {
          expiresAt: Date.now() + HOLDINGS_CACHE_TTL_MS,
          data
        }
        return NextResponse.json(data)
      }
    } catch {
      // try next symbol
    }
  }

  return NextResponse.json({ error: "Holdings unavailable" }, { status: 404 })
}
