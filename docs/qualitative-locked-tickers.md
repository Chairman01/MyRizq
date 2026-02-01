# Locked qualitative tickers

These tickers are treated as correct and will **skip LLM extraction**.

| Ticker | Reason | Notes |
| --- | --- | --- |
| AMZN | manual_override | 2024 segment table stored |
| DIS | manual_override | 2025 segment table stored |
| WMT | manual_override | 2025 segment table stored |
| MA | manual_override | 2024 net revenue by category stored |
| V | manual_override | 2025 net revenue table stored |
| JNJ | manual_override | 2024 segment summary stored |
| BBY | manual_override | manual override for revenue segments |
| TSLA | manual_override | manual review confirmed |
| NVDA | strong_hints | ticker-specific parsing hints |
| AAPL | strong_hints | ticker-specific parsing hints |
| META | strong_hints | ticker-specific parsing hints |
| GOOGL | strong_hints | ticker-specific parsing hints |
| GOOG | strong_hints | ticker-specific parsing hints |
| NFLX | strong_hints | ticker-specific parsing hints |
| MSFT | strong_hints | ticker-specific parsing hints |

## Add a new locked ticker

If an LLM extraction is confirmed correct, add it to:

- `lib/sec/locked-tickers.ts`
- This table
