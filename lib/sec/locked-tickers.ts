export type LockedTickerReason = "manual_override" | "strong_hints" | "llm_verified"

export type LockedTickerEntry = {
  ticker: string
  reason: LockedTickerReason
  notes?: string
}

export const LOCKED_TICKERS: LockedTickerEntry[] = [
  { ticker: "AMZN", reason: "manual_override", notes: "2024 segment table stored" },
  { ticker: "DIS", reason: "manual_override", notes: "2025 segment table stored" },
  { ticker: "WMT", reason: "manual_override", notes: "2025 segment table stored" },
  { ticker: "MA", reason: "manual_override", notes: "2024 net revenue by category stored" },
  { ticker: "V", reason: "manual_override", notes: "2025 net revenue table stored" },
  { ticker: "JNJ", reason: "manual_override", notes: "2024 segment summary stored" },
  { ticker: "BBY", reason: "manual_override", notes: "manual override for revenue segments" },
  { ticker: "TSLA", reason: "manual_override", notes: "manual review confirmed" },
  { ticker: "ABBV", reason: "manual_override", notes: "2024 segment summary: Immunology $26.7B, Neuroscience $9B, Oncology $6.6B, Aesthetics $5.2B, Eye Care $2.2B" },
  { ticker: "ABNB", reason: "manual_override", notes: "2024 unified marketplace platform revenue $11.1B - 100% halal" },
  { ticker: "COST", reason: "manual_override", notes: "2025 10-K: Net Sales $269.9B + Membership Fees $5.3B = $275.2B - 100% halal" },
  { ticker: "XOM", reason: "manual_override", notes: "2024 segment earnings: Upstream $25.4B, Energy Products $4B, Chemical $2.6B, Specialty $3B - 100% halal" },
  { ticker: "NVDA", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "AAPL", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "META", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "GOOGL", reason: "manual_override", notes: "2024 10-K: Total $350B - Search $198B, Cloud $43B, Subscriptions $40B, YouTube $36B, Network $30B" },
  { ticker: "GOOG", reason: "manual_override", notes: "2024 10-K: Total $350B - Search $198B, Cloud $43B, Subscriptions $40B, YouTube $36B, Network $30B" },
  { ticker: "ADBE", reason: "manual_override", notes: "2025 10-K: Subscription $22.9B, Services $540M, Product $325M = $23.8B - 100% halal software" },
  { ticker: "AMD", reason: "manual_override", notes: "2024 10-K: Data Center $12.6B, Client $7B, Embedded $3.6B, Gaming $2.6B = $25.8B - 100% halal semiconductors" },
  { ticker: "AMT", reason: "manual_override", notes: "2024 10-K: Property (US/Canada, LatAm, APAC, Data Centers, Europe) + Services = $10.1B - 100% halal tower infrastructure" },
  { ticker: "CSCO", reason: "manual_override", notes: "2025 10-K: Product $41.6B, Services $15B = $56.7B - 100% halal networking" },
  { ticker: "AVGO", reason: "manual_override", notes: "2025 10-K: Products $44.8B, Subscriptions/Services $19B = $63.9B - 100% halal semiconductors" },
  { ticker: "NFLX", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "MSFT", reason: "strong_hints", notes: "ticker-specific parsing hints" }
]

export function isLockedTicker(ticker?: string) {
  if (!ticker) return false
  return LOCKED_TICKERS.some(entry => entry.ticker === ticker.toUpperCase())
}
