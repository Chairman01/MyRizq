export type SegmentHints = {
    tableHintRegex?: RegExp
    rowLabelRegex?: RegExp
    rowExcludeRegex?: RegExp
    maxSegments?: number
    labelTag?: string
    expectedSegments?: string[]
    preferMaxValue?: boolean
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
        ],
        preferMaxValue: true
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
        tableHintRegex: /(revenue,\s+classified\s+by\s+significant\s+product\s+and\s+service\s+offerings|significant\s+product\s+and\s+service\s+offerings|revenue\s+by\s+significant\s+product\s+and\s+service|significant\s+product\s+and\s+service.*revenue)/i,
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
    },
    ADBE: {
        tableHintRegex: /(revenue|subscription|product|services\s+and\s+other)/i,
        rowLabelRegex: /(subscription|product|services\s+and\s+other)/i,
        rowExcludeRegex: /(total\s+revenue|percentage)/i,
        maxSegments: 4,
        labelTag: "10-K table (adobe revenue by type)",
        expectedSegments: [
            "Subscription",
            "Product",
            "Services and other"
        ]
    },
    ABBV: {
        tableHintRegex: /(net\s+revenues?|product\s+revenues?|immunology|neuroscience|oncology|aesthetics|eye\s+care)/i,
        rowLabelRegex: /(immunology|neuroscience|oncology|aesthetics|eye\s+care|other\s+key\s+products|all\s+other)/i,
        rowExcludeRegex: /(total|net\s+revenues?$|percentage)/i,
        maxSegments: 10,
        labelTag: "10-K table (abbvie revenue by therapeutic area)",
        expectedSegments: [
            "Immunology",
            "Neuroscience",
            "Oncology",
            "Aesthetics",
            "Eye Care",
            "Other Key Products",
            "All Other"
        ]
    },
    ABNB: {
        tableHintRegex: /(revenue|marketplace|platform|service\s+fees?)/i,
        rowLabelRegex: /(marketplace\s+platform|service\s+fees?|platform\s+revenue)/i,
        rowExcludeRegex: /(total|percentage)/i,
        maxSegments: 3,
        labelTag: "10-K table (airbnb revenue)",
        expectedSegments: [
            "Marketplace Platform Revenue"
        ]
    },
    COST: {
        tableHintRegex: /(net\s+sales|membership\s+fees?|revenue)/i,
        rowLabelRegex: /(net\s+sales|membership\s+fees?)/i,
        rowExcludeRegex: /(total\s+revenue|percentage)/i,
        maxSegments: 4,
        labelTag: "10-K table (costco revenue)",
        expectedSegments: [
            "Net Sales",
            "Membership Fees"
        ]
    },
    XOM: {
        tableHintRegex: /(earnings\s+by\s+segment|segment\s+earnings|upstream|energy\s+products|chemical\s+products|specialty\s+products)/i,
        rowLabelRegex: /(upstream|energy\s+products|chemical\s+products|specialty\s+products)/i,
        rowExcludeRegex: /(total|corporate|financing|eliminations)/i,
        maxSegments: 6,
        labelTag: "10-K table (exxon segment earnings)",
        expectedSegments: [
            "Upstream",
            "Energy Products",
            "Chemical Products",
            "Specialty Products"
        ]
    },
    AMZN: {
        tableHintRegex: /(net\s+sales|revenue\s+by\s+segment|north\s+america|international|aws|amazon\s+web\s+services)/i,
        rowLabelRegex: /(north\s+america|international|aws|amazon\s+web\s+services)/i,
        rowExcludeRegex: /(total|consolidated|eliminations)/i,
        maxSegments: 5,
        labelTag: "10-K table (amazon revenue by segment)",
        expectedSegments: [
            "North America",
            "International",
            "AWS"
        ]
    },
    DIS: {
        tableHintRegex: /(revenues?\s+by\s+segment|entertainment|sports|experiences)/i,
        rowLabelRegex: /(entertainment|sports|experiences|direct-to-consumer|linear\s+networks|content\s+sales|parks)/i,
        rowExcludeRegex: /(total|eliminations|corporate)/i,
        maxSegments: 8,
        labelTag: "10-K table (disney revenue by segment)",
        expectedSegments: [
            "Entertainment",
            "Sports",
            "Experiences"
        ]
    },
    JNJ: {
        tableHintRegex: /(sales\s+by\s+segment|net\s+sales|innovative\s+medicine|medtech)/i,
        rowLabelRegex: /(innovative\s+medicine|medtech|pharmaceutical|medical\s+devices)/i,
        rowExcludeRegex: /(total|consumer\s+health|worldwide)/i,
        maxSegments: 4,
        labelTag: "10-K table (jnj revenue by segment)",
        expectedSegments: [
            "Innovative Medicine",
            "MedTech"
        ]
    },
    MA: {
        tableHintRegex: /(net\s+revenue|payment\s+network|value.added\s+services|domestic\s+assessments|cross.border)/i,
        rowLabelRegex: /(payment\s+network|value.added\s+services|domestic\s+assessments|cross.border\s+volume|transaction\s+processing|other\s+revenues?|rebates|incentives)/i,
        rowExcludeRegex: /(total|net\s+revenue$)/i,
        maxSegments: 8,
        labelTag: "10-K table (mastercard net revenue)",
        expectedSegments: [
            "Payment Network",
            "Value-Added Services and Solutions"
        ]
    },
    V: {
        tableHintRegex: /(net\s+revenues?|service\s+revenues?|data\s+processing|international\s+transaction|other\s+revenues?)/i,
        rowLabelRegex: /(service\s+revenues?|data\s+processing\s+revenues?|international\s+transaction\s+revenues?|other\s+revenues?|client\s+incentives)/i,
        rowExcludeRegex: /(total|net\s+revenues?$)/i,
        maxSegments: 6,
        labelTag: "10-K table (visa net revenue)",
        expectedSegments: [
            "Service revenues",
            "Data processing revenues",
            "International transaction revenues",
            "Other revenues"
        ]
    },
    TSLA: {
        tableHintRegex: /(revenues?\s+by\s+source|automotive|energy\s+generation|services\s+and\s+other)/i,
        rowLabelRegex: /(automotive\s+sales|automotive\s+regulatory\s+credits|automotive\s+leasing|energy\s+generation\s+and\s+storage|services\s+and\s+other)/i,
        rowExcludeRegex: /(total|revenues?$)/i,
        maxSegments: 8,
        labelTag: "10-K table (tesla revenue by source)",
        expectedSegments: [
            "Automotive sales",
            "Automotive regulatory credits",
            "Automotive leasing",
            "Energy generation and storage",
            "Services and other"
        ]
    },
    WMT: {
        tableHintRegex: /(net\s+sales|revenues?\s+by\s+segment|walmart\s+u\.?s\.?|walmart\s+international|sam'?s\s+club)/i,
        rowLabelRegex: /(walmart\s+u\.?s\.?|walmart\s+international|sam'?s\s+club)/i,
        rowExcludeRegex: /(total|consolidated|net\s+sales$)/i,
        maxSegments: 5,
        labelTag: "10-K table (walmart revenue by segment)",
        expectedSegments: [
            "Walmart U.S.",
            "Walmart International",
            "Sam's Club"
        ]
    },
    AMD: {
        tableHintRegex: /(net\s+revenue|revenue\s+by\s+segment|data\s+center|client|gaming|embedded)/i,
        rowLabelRegex: /(data\s+center|client|gaming|embedded)/i,
        rowExcludeRegex: /(total|net\s+revenue$|operating\s+income)/i,
        maxSegments: 5,
        labelTag: "10-K table (amd revenue by segment)",
        expectedSegments: [
            "Data Center",
            "Client",
            "Gaming",
            "Embedded"
        ]
    },
    AMT: {
        tableHintRegex: /(revenue|property|services|u\.?s\.?\s*&?\s*canada|latin\s+america|europe|africa|apac|data\s+centers?)/i,
        rowLabelRegex: /(u\.?s\.?\s*&?\s*canada|latin\s+america|africa\s*&?\s*apac|europe|data\s+centers?|services|total\s+property)/i,
        rowExcludeRegex: /(total\s+revenues?$|percentage)/i,
        maxSegments: 8,
        labelTag: "10-K table (american tower revenue by region)",
        expectedSegments: [
            "U.S. & Canada",
            "Latin America",
            "Africa & APAC",
            "Europe",
            "Data Centers",
            "Services"
        ]
    },
    CSCO: {
        tableHintRegex: /(revenue|product|services)/i,
        rowLabelRegex: /(product|services)/i,
        rowExcludeRegex: /(total|percentage)/i,
        maxSegments: 4,
        labelTag: "10-K table (cisco revenue by type)",
        expectedSegments: [
            "Product",
            "Services"
        ]
    },
    AVGO: {
        tableHintRegex: /(net\s+revenue|products?|subscriptions?\s+and\s+services)/i,
        rowLabelRegex: /(products?|subscriptions?\s+and\s+services)/i,
        rowExcludeRegex: /(total|percentage)/i,
        maxSegments: 4,
        labelTag: "10-K table (broadcom revenue by type)",
        expectedSegments: [
            "Products",
            "Subscriptions and services"
        ]
    }
}

export function getSegmentHints(ticker?: string): SegmentHints | null {
    if (!ticker) return null
    return SEGMENT_HINTS[ticker.toUpperCase()] || null
}
