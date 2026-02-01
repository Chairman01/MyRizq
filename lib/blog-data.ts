export interface BlogPost {
    slug: string
    title: string
    excerpt: string
    category: "getting-started" | "etf-analysis" | "islamic-finance" | "guides"
    author: string
    date: string
    readTime: string
    featured?: boolean
    imageUrl?: string
}

export const blogPosts: BlogPost[] = [
    {
        slug: "what-is-halal-etf",
        title: "What is a Halal ETF? A Complete Beginner's Guide",
        excerpt: "Learn what makes an ETF Shariah-compliant, how they screen for halal investments, and why they matter for Muslim investors.",
        category: "getting-started",
        author: "MyRizq Team",
        date: "2026-01-15",
        readTime: "8 min",
        featured: true,
    },
    {
        slug: "how-to-start",
        title: "How to Start Halal Investing in 2026",
        excerpt: "A step-by-step guide to beginning your halal investment journey, from opening a brokerage account to making your first purchase.",
        category: "getting-started",
        author: "MyRizq Team",
        date: "2026-01-10",
        readTime: "10 min",
        featured: true,
    },
    {
        slug: "brokers",
        title: "Where to Buy Halal ETFs: Complete Broker Guide",
        excerpt: "Comprehensive guide to brokers offering Halal ETFs in the US, UK, Canada, and globally. Compare fees, access, and features.",
        category: "guides",
        author: "MyRizq Team",
        date: "2026-01-08",
        readTime: "12 min",
        featured: true,
    },
    {
        slug: "spus-vs-hlal",
        title: "SPUS vs HLAL: Which US Halal ETF is Better?",
        excerpt: "An in-depth comparison of the two most popular US Halal ETFs - expense ratios, performance, holdings, and our recommendation.",
        category: "etf-analysis",
        author: "MyRizq Team",
        date: "2026-01-05",
        readTime: "7 min",
    },
    {
        slug: "shariah-screening",
        title: "How Do ETFs Screen for Shariah Compliance?",
        excerpt: "Understanding the methodology behind Shariah screening - business activities, financial ratios, and certification processes.",
        category: "islamic-finance",
        author: "MyRizq Team",
        date: "2026-01-01",
        readTime: "9 min",
    },
    {
        slug: "global-vs-us-etfs",
        title: "Global vs US Halal ETFs: Diversification Guide",
        excerpt: "Should you invest only in US markets or diversify globally? We analyze the pros and cons of each approach.",
        category: "etf-analysis",
        author: "MyRizq Team",
        date: "2025-12-28",
        readTime: "6 min",
    },
]

export const categoryLabels: Record<BlogPost["category"], string> = {
    "getting-started": "Getting Started",
    "etf-analysis": "ETF Analysis",
    "islamic-finance": "Islamic Finance",
    "guides": "Guides",
}

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find(post => post.slug === slug)
}
