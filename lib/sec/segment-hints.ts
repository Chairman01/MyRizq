export type SegmentHints = {
    tableHintRegex?: RegExp
    rowLabelRegex?: RegExp
    rowExcludeRegex?: RegExp
    maxSegments?: number
    labelTag?: string
    expectedSegments?: string[]
}

const SEGMENT_HINTS: Record<string, SegmentHints> = {
    META: {
        tableHintRegex: /(revenue\s+by\s+source|revenues?\s+by\s+type|advertising|family\s+of\s+apps|reality\s+labs|other\s+revenue)/i,
        rowLabelRegex: /(advertising|other\s+revenue|family\s+of\s+apps|reality\s+labs)/i,
        maxSegments: 6,
        labelTag: "10-K table (meta revenue by type)",
        expectedSegments: [
            "Advertising",
            "Other revenue",
            "Family of apps",
            "Reality Labs"
        ]
    },
    GOOGL: {
        tableHintRegex: /(revenues?\s+by\s+type|google\s+search|youtube|google\s+cloud|other\s+bets|google\s+network)/i,
        rowLabelRegex: /(google\s+search|youtube|google\s+network|google\s+advertising|google\s+subscriptions|platforms|devices|google\s+cloud|other\s+bets|hedging\s+gains)/i,
        rowExcludeRegex: /(google\s+services\s+total|total\s+revenues?|google\s+advertising)/i,
        maxSegments: 12,
        labelTag: "10-K table (google revenues by type)",
        expectedSegments: [
            "Google Search & other",
            "YouTube ads",
            "Google Network",
            "Google subscriptions, platforms, and devices",
            "Google Cloud",
            "Other Bets",
            "Hedging gains (losses)"
        ]
    },
    GOOG: {
        tableHintRegex: /(revenues?\s+by\s+type|google\s+search|youtube|google\s+cloud|other\s+bets|google\s+network)/i,
        rowLabelRegex: /(google\s+search|youtube|google\s+network|google\s+advertising|google\s+subscriptions|platforms|devices|google\s+cloud|other\s+bets|hedging\s+gains)/i,
        rowExcludeRegex: /(google\s+services\s+total|total\s+revenues?|google\s+advertising)/i,
        maxSegments: 12,
        labelTag: "10-K table (google revenues by type)",
        expectedSegments: [
            "Google Search & other",
            "YouTube ads",
            "Google Network",
            "Google subscriptions, platforms, and devices",
            "Google Cloud",
            "Other Bets",
            "Hedging gains (losses)"
        ]
    },
    NFLX: {
        tableHintRegex: /(streaming\s+revenues?|dvd\s+revenues?)/i,
        rowLabelRegex: /(streaming\s+revenues?|dvd\s+revenues?)/i,
        maxSegments: 6,
        labelTag: "10-K table (netflix revenue by type)",
        expectedSegments: [
            "Streaming revenues",
            "DVD revenues"
        ]
    },
    AAPL: {
        tableHintRegex: /(net\s+sales|revenue\s+by\s+product|net\s+sales\s+by\s+product|net\s+sales\s+by\s+reportable\s+segment)/i,
        rowLabelRegex: /(iphone|mac|ipad|wearables|services|accessories|home\s+and\s+accessories)/i,
        rowExcludeRegex: /(total|net\s+sales)/i,
        maxSegments: 8,
        labelTag: "10-K table (apple net sales by product)",
        expectedSegments: [
            "iPhone",
            "Mac",
            "iPad",
            "Wearables, Home and Accessories",
            "Services"
        ]
    },
    NVDA: {
        tableHintRegex: /(revenue\s+by\s+reportable\s+segments|reportable\s+segments)/i,
        rowLabelRegex: /(compute\s+&\s+networking|compute\s+and\s+networking|graphics)/i,
        rowExcludeRegex: /(total|operating\s+income|operating\s+income\s+by\s+reportable\s+segments)/i,
        maxSegments: 4,
        labelTag: "10-K table (nvda reportable segments)",
        expectedSegments: [
            "Compute & Networking",
            "Graphics"
        ]
    },
    MSFT: {
        tableHintRegex: /(revenue,\s+classified\s+by\s+significant\s+product\s+and\s+service\s+offerings|significant\s+product\s+and\s+service\s+offerings)/i,
        rowLabelRegex: /(server\s+products\s+and\s+cloud\s+services|microsoft\s+365\s+commercial\s+products\s+and\s+cloud\s+services|gaming|linkedin|windows\s+and\s+devices|search\s+and\s+news\s+advertising|dynamics\s+products\s+and\s+cloud\s+services|enterprise\s+and\s+partner\s+services|microsoft\s+365\s+consumer\s+products\s+and\s+cloud\s+services|other)/i,
        rowExcludeRegex: /(total|growth|%)/i,
        maxSegments: 12,
        labelTag: "10-K table (msft revenue by offering)",
        expectedSegments: [
            "Server products and cloud services",
            "Microsoft 365 Commercial products and cloud services",
            "Gaming",
            "LinkedIn",
            "Windows and Devices",
            "Search and news advertising",
            "Dynamics products and cloud services",
            "Enterprise and partner services",
            "Microsoft 365 Consumer products and cloud services",
            "Other"
        ]
    }
}

export function getSegmentHints(ticker?: string): SegmentHints | null {
    if (!ticker) return null
    return SEGMENT_HINTS[ticker.toUpperCase()] || null
}
