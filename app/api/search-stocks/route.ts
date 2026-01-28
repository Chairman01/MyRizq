import { NextRequest, NextResponse } from "next/server"

// Helper function to create Yahoo Finance instance
async function getYahooFinance() {
    const { default: YahooFinance } = await import("yahoo-finance2")
    return new YahooFinance()
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [] })
    }

    try {
        const yahooFinance = await getYahooFinance()

        // Use yahooFinance.search with proper options
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchResults: any = await yahooFinance.search(query)

        // Get quotes from the search results
        const quotes = searchResults?.quotes || []

        // Filter and format results
        const results = quotes
            .filter((quote: { quoteType?: string }) =>
                quote.quoteType === "EQUITY" || quote.quoteType === "ETF"
            )
            .slice(0, 10)
            .map((quote: {
                symbol?: string;
                shortname?: string;
                longname?: string;
                quoteType?: string;
                exchange?: string;
                exchDisp?: string;
            }) => ({
                symbol: quote.symbol || "",
                name: quote.shortname || quote.longname || quote.symbol || "",
                type: quote.quoteType || "EQUITY",
                exchange: quote.exchDisp || quote.exchange || ""
            }))

        return NextResponse.json({ results })
    } catch (error) {
        console.error("Search API Error:", error)
        return NextResponse.json({
            results: [],
            error: error instanceof Error ? error.message : "Unknown error"
        })
    }
}
