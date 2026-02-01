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
  { ticker: "NVDA", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "AAPL", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "META", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "GOOGL", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "GOOG", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "NFLX", reason: "strong_hints", notes: "ticker-specific parsing hints" },
  { ticker: "MSFT", reason: "strong_hints", notes: "ticker-specific parsing hints" }
]

export function isLockedTicker(ticker?: string) {
  if (!ticker) return false
  return LOCKED_TICKERS.some(entry => entry.ticker === ticker.toUpperCase())
}
