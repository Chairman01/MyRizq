// Stock Data Library for Shariah Compliance Screening
// Based on AAOIFI standards

// Helper to check compliance status consistency across app
export function checkCompliance(ticker: string, type: 'Stock' | 'ETF' | string): boolean {
    // 1. All ETFs are considered compliant (User Rule)
    if (type === 'ETF') return true

    // 2. Check Database for Stocks
    const stock = stockDatabase[ticker.toUpperCase()]
    if (stock) {
        // Must be explicitly Compliant checkScreening logic
        const result = screenStock(ticker)
        return result?.overallStatus === "Compliant"
    }

    // 3. Default to False if not found (Safety)
    return false
}

export interface Stock {
    ticker: string
    name: string
    logo?: string
    sector: string
    marketCap: number // in millions
    // Quantitative Data (for ratio calculations)
    totalDebt: number
    cashAndEquivalents: number
    deposits: number
    accountsReceivable: number
    totalAssets: number
    // Qualitative Data
    revenueBreakdown: {
        compliant: number
        questionable: number
        nonCompliant: number
    }
    businessActivities: string[]
    lastUpdated: string
}

export interface ScreeningResult {
    ticker: string
    name: string
    logo?: string
    sector: string
    isShariahCompliant: boolean
    isBDSListed: boolean
    businessActivities: string[]
    lastUpdated: string
    financialCurrency?: string
    qualitative: {
        passed: boolean
        compliantPercent: number | null
        questionablePercent: number | null
        nonCompliantPercent: number | null
        issues: string[]
        revenueDataAvailable?: boolean
        dataSources?: {
            totalRevenue: string
            segmentRevenue: string
            interestIncome: string
            xbrlTags?: {
                totalRevenue: string
                interestIncome: string
            }
        }
        xbrlTags?: {
            totalRevenue: string
            interestIncome: string
        }
        segmentBreakdown?: {
            name: string
            value: number
            tag: string
            end?: string
            percentOfTotal?: number
            compliance?: "halal" | "haram" | "questionable"
        }[]
        segmentTotal?: number
        method?: "segment_based" | "industry_estimate" | "insufficient_data"
    }
    quantitative: {
        passed: boolean
        debtRatio: number
        securitiesRatio: number
        liquidityRatio: number | null
        debtPassed: boolean
        securitiesPassed: boolean
        liquidityPassed: boolean
        liquidityRatioAvailable?: boolean
    }
    rawData: {
        marketCap: number
        totalDebt: number
        cashAndEquivalents: number
        deposits: number
        accountsReceivable: number
        totalAssets: number
        totalRevenue?: number
    }
    profile?: {
        description: string
        website: string
        country: string
        city: string
        employees: number
        exchange: string
        currency: string
    }
    secFiling?: {
        url: string
        filedAt: string
        accession: string
        primaryDocument: string
    }
    industry?: string
    overallStatus: "Compliant" | "Questionable" | "Non-Compliant"
}

// BDS Boycott List - Companies that support or are complicit with Israeli occupation
// Source: https://bdsmovement.net/Guide-to-BDS-Boycott
export const bdsBoycottList: string[] = [
    // Consumer Goods & Food
    "SBUX",   // Starbucks
    "MCD",    // McDonald's
    "KO",     // Coca-Cola
    "PEP",    // PepsiCo
    "NSRGY",  // Nestlé
    "PZZA",   // Papa John's
    "DPZ",    // Domino's
    // Technology
    "HPQ",    // HP Inc
    "HPE",    // HP Enterprise
    "INTC",   // Intel
    // Defense & Industrial
    "CAT",    // Caterpillar
    "LMT",    // Lockheed Martin
    "RTX",    // Raytheon
    "BA",     // Boeing
    "GD",     // General Dynamics
    "NOC",    // Northrop Grumman
    // Finance & Banking (with Israel operations)
    "AXP",    // American Express
    // Retail & Consumer
    "PUMSY",  // Puma
    "ADS.DE", // Adidas (some controversy)
    // Entertainment
    "DIS",    // Disney
]

// Non-Halal Business Activities
export const haramActivities = [
    "Conventional Banking/Interest",
    "Insurance (Conventional)",
    "Alcohol Production/Sales",
    "Tobacco Production",
    "Pork Products",
    "Gambling/Casinos",
    "Adult Entertainment",
    "Weapons Manufacturing",
]

// Demo stock database
export const stockDatabase: Record<string, Stock> = {
    "TSLA": {
        ticker: "TSLA",
        name: "Tesla Inc",
        logo: "https://logo.clearbit.com/tesla.com",
        sector: "Consumer Cyclical",
        marketCap: 800000,
        totalDebt: 5500,
        cashAndEquivalents: 22000,
        deposits: 0,
        accountsReceivable: 3500,
        totalAssets: 95000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Electric Vehicles", "Energy Storage", "Solar Panels"],
        lastUpdated: "2024-01-15"
    },
    "AAPL": {
        ticker: "AAPL",
        name: "Apple Inc",
        logo: "https://logo.clearbit.com/apple.com",
        sector: "Technology",
        marketCap: 2800000,
        totalDebt: 111000,
        cashAndEquivalents: 62000,
        deposits: 0,
        accountsReceivable: 29000,
        totalAssets: 352000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Consumer Electronics", "Software Services", "Digital Content"],
        lastUpdated: "2024-01-15"
    },
    "MSFT": {
        ticker: "MSFT",
        name: "Microsoft Corporation",
        logo: "https://logo.clearbit.com/microsoft.com",
        sector: "Technology",
        marketCap: 2900000,
        totalDebt: 47000,
        cashAndEquivalents: 80000,
        deposits: 0,
        accountsReceivable: 44000,
        totalAssets: 411000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Software", "Cloud Computing", "Gaming", "Defense Contracts"],
        lastUpdated: "2024-01-15"
    },
    "GOOGL": {
        ticker: "GOOGL",
        name: "Alphabet Inc",
        logo: "https://logo.clearbit.com/google.com",
        sector: "Technology",
        marketCap: 1700000,
        totalDebt: 14500,
        cashAndEquivalents: 110000,
        deposits: 0,
        accountsReceivable: 34000,
        totalAssets: 365000,
        revenueBreakdown: { compliant: 97, questionable: 3, nonCompliant: 0 },
        businessActivities: ["Digital Advertising", "Cloud Services", "Consumer Hardware"],
        lastUpdated: "2024-01-15"
    },
    "AMZN": {
        ticker: "AMZN",
        name: "Amazon.com Inc",
        logo: "https://logo.clearbit.com/amazon.com",
        sector: "Consumer Cyclical",
        marketCap: 1500000,
        totalDebt: 67000,
        cashAndEquivalents: 54000,
        deposits: 0,
        accountsReceivable: 32000,
        totalAssets: 462000,
        revenueBreakdown: { compliant: 96, questionable: 3, nonCompliant: 1 },
        businessActivities: ["E-Commerce", "Cloud Computing", "Streaming", "Logistics"],
        lastUpdated: "2024-01-15"
    },
    "META": {
        ticker: "META",
        name: "Meta Platforms Inc",
        logo: "https://logo.clearbit.com/meta.com",
        sector: "Technology",
        marketCap: 900000,
        totalDebt: 18000,
        cashAndEquivalents: 41000,
        deposits: 0,
        accountsReceivable: 14000,
        totalAssets: 185000,
        revenueBreakdown: { compliant: 94, questionable: 4, nonCompliant: 2 },
        businessActivities: ["Social Media", "Digital Advertising", "Virtual Reality"],
        lastUpdated: "2024-01-15"
    },
    "NVDA": {
        ticker: "NVDA",
        name: "NVIDIA Corporation",
        logo: "https://logo.clearbit.com/nvidia.com",
        sector: "Technology",
        marketCap: 1200000,
        totalDebt: 10000,
        cashAndEquivalents: 18000,
        deposits: 0,
        accountsReceivable: 10000,
        totalAssets: 65000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Semiconductors", "AI Hardware", "Gaming Graphics"],
        lastUpdated: "2024-01-15"
    },
    // Non-Compliant Stocks
    "PYPL": {
        ticker: "PYPL",
        name: "PayPal Holdings Inc",
        logo: "https://logo.clearbit.com/paypal.com",
        sector: "Financial Services",
        marketCap: 70000,
        totalDebt: 10000,
        cashAndEquivalents: 15000,
        deposits: 0,
        accountsReceivable: 500,
        totalAssets: 80000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Payment Processing", "Credit Services", "Interest Income"],
        lastUpdated: "2024-01-15"
    },
    "JPM": {
        ticker: "JPM",
        name: "JPMorgan Chase & Co",
        logo: "https://logo.clearbit.com/jpmorganchase.com",
        sector: "Financial Services",
        marketCap: 450000,
        totalDebt: 300000,
        cashAndEquivalents: 600000,
        deposits: 2000000,
        accountsReceivable: 50000,
        totalAssets: 3700000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Banking", "Investment Banking", "Interest Income", "Credit Cards"],
        lastUpdated: "2024-01-15"
    },
    "BAC": {
        ticker: "BAC",
        name: "Bank of America Corp",
        logo: "https://logo.clearbit.com/bankofamerica.com",
        sector: "Financial Services",
        marketCap: 280000,
        totalDebt: 250000,
        cashAndEquivalents: 300000,
        deposits: 1900000,
        accountsReceivable: 30000,
        totalAssets: 3000000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Banking", "Mortgages", "Interest Income", "Credit Cards"],
        lastUpdated: "2024-01-15"
    },
    // BDS Listed Stocks
    "SBUX": {
        ticker: "SBUX",
        name: "Starbucks Corporation",
        logo: "https://logo.clearbit.com/starbucks.com",
        sector: "Consumer Cyclical",
        marketCap: 100000,
        totalDebt: 14000,
        cashAndEquivalents: 3500,
        deposits: 0,
        accountsReceivable: 800,
        totalAssets: 30000,
        revenueBreakdown: { compliant: 85, questionable: 10, nonCompliant: 5 },
        businessActivities: ["Coffee Retail", "Food Service"],
        lastUpdated: "2024-01-15"
    },
    "MCD": {
        ticker: "MCD",
        name: "McDonald's Corporation",
        logo: "https://logo.clearbit.com/mcdonalds.com",
        sector: "Consumer Cyclical",
        marketCap: 200000,
        totalDebt: 37000,
        cashAndEquivalents: 4500,
        deposits: 0,
        accountsReceivable: 2000,
        totalAssets: 53000,
        revenueBreakdown: { compliant: 90, questionable: 5, nonCompliant: 5 },
        businessActivities: ["Fast Food", "Franchising"],
        lastUpdated: "2024-01-15"
    },
    "KO": {
        ticker: "KO",
        name: "The Coca-Cola Company",
        logo: "https://logo.clearbit.com/coca-cola.com",
        sector: "Consumer Defensive",
        marketCap: 260000,
        totalDebt: 43000,
        cashAndEquivalents: 13000,
        deposits: 0,
        accountsReceivable: 3700,
        totalAssets: 95000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Beverages", "Soft Drinks"],
        lastUpdated: "2024-01-15"
    },
    "CAT": {
        ticker: "CAT",
        name: "Caterpillar Inc",
        logo: "https://logo.clearbit.com/caterpillar.com",
        sector: "Industrials",
        marketCap: 150000,
        totalDebt: 25000,
        cashAndEquivalents: 6000,
        deposits: 0,
        accountsReceivable: 10000,
        totalAssets: 82000,
        revenueBreakdown: { compliant: 70, questionable: 10, nonCompliant: 20 },
        businessActivities: ["Construction Equipment", "Mining Equipment", "Demolition Equipment"],
        lastUpdated: "2024-01-15"
    },
    "LMT": {
        ticker: "LMT",
        name: "Lockheed Martin Corporation",
        logo: "https://logo.clearbit.com/lockheedmartin.com",
        sector: "Industrials",
        marketCap: 120000,
        totalDebt: 18000,
        cashAndEquivalents: 2800,
        deposits: 0,
        accountsReceivable: 2500,
        totalAssets: 52000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Weapons Manufacturing", "Defense Systems", "Military Aircraft"],
        lastUpdated: "2024-01-15"
    },
    // Additional Technology Stocks
    "AMD": {
        ticker: "AMD",
        name: "Advanced Micro Devices",
        logo: "https://logo.clearbit.com/amd.com",
        sector: "Technology",
        marketCap: 220000,
        totalDebt: 2500,
        cashAndEquivalents: 5800,
        deposits: 0,
        accountsReceivable: 6000,
        totalAssets: 67000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Semiconductors", "Processors", "Graphics Cards"],
        lastUpdated: "2024-01-15"
    },
    "CRM": {
        ticker: "CRM",
        name: "Salesforce Inc",
        logo: "https://logo.clearbit.com/salesforce.com",
        sector: "Technology",
        marketCap: 280000,
        totalDebt: 9500,
        cashAndEquivalents: 14000,
        deposits: 0,
        accountsReceivable: 11000,
        totalAssets: 99000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Cloud Software", "CRM Solutions", "Enterprise Software"],
        lastUpdated: "2024-01-15"
    },
    "ORCL": {
        ticker: "ORCL",
        name: "Oracle Corporation",
        logo: "https://logo.clearbit.com/oracle.com",
        sector: "Technology",
        marketCap: 310000,
        totalDebt: 88000,
        cashAndEquivalents: 10000,
        deposits: 0,
        accountsReceivable: 7000,
        totalAssets: 134000,
        revenueBreakdown: { compliant: 97, questionable: 3, nonCompliant: 0 },
        businessActivities: ["Database Software", "Cloud Infrastructure", "Enterprise Software"],
        lastUpdated: "2024-01-15"
    },
    "ADBE": {
        ticker: "ADBE",
        name: "Adobe Inc",
        logo: "https://logo.clearbit.com/adobe.com",
        sector: "Technology",
        marketCap: 240000,
        totalDebt: 4100,
        cashAndEquivalents: 7500,
        deposits: 0,
        accountsReceivable: 2000,
        totalAssets: 30000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Creative Software", "Digital Marketing", "Document Solutions"],
        lastUpdated: "2024-01-15"
    },
    "NFLX": {
        ticker: "NFLX",
        name: "Netflix Inc",
        logo: "https://logo.clearbit.com/netflix.com",
        sector: "Communication Services",
        marketCap: 270000,
        totalDebt: 14500,
        cashAndEquivalents: 7100,
        deposits: 0,
        accountsReceivable: 800,
        totalAssets: 48000,
        revenueBreakdown: { compliant: 92, questionable: 5, nonCompliant: 3 },
        businessActivities: ["Streaming Services", "Content Production", "Entertainment"],
        lastUpdated: "2024-01-15"
    },
    "CSCO": {
        ticker: "CSCO",
        name: "Cisco Systems Inc",
        logo: "https://logo.clearbit.com/cisco.com",
        sector: "Technology",
        marketCap: 200000,
        totalDebt: 9000,
        cashAndEquivalents: 26000,
        deposits: 0,
        accountsReceivable: 6500,
        totalAssets: 100000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Networking Equipment", "Software", "Security Solutions"],
        lastUpdated: "2024-01-15"
    },
    "AVGO": {
        ticker: "AVGO",
        name: "Broadcom Inc",
        logo: "https://logo.clearbit.com/broadcom.com",
        sector: "Technology",
        marketCap: 600000,
        totalDebt: 39000,
        cashAndEquivalents: 14000,
        deposits: 0,
        accountsReceivable: 5000,
        totalAssets: 165000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Semiconductors", "Infrastructure Software", "Networking"],
        lastUpdated: "2024-01-15"
    },
    "QCOM": {
        ticker: "QCOM",
        name: "Qualcomm Inc",
        logo: "https://logo.clearbit.com/qualcomm.com",
        sector: "Technology",
        marketCap: 180000,
        totalDebt: 15000,
        cashAndEquivalents: 8500,
        deposits: 0,
        accountsReceivable: 4600,
        totalAssets: 52000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Semiconductors", "Wireless Technology", "5G Chips"],
        lastUpdated: "2024-01-15"
    },
    // Healthcare Stocks
    "JNJ": {
        ticker: "JNJ",
        name: "Johnson & Johnson",
        logo: "https://logo.clearbit.com/jnj.com",
        sector: "Healthcare",
        marketCap: 380000,
        totalDebt: 30000,
        cashAndEquivalents: 24000,
        deposits: 0,
        accountsReceivable: 17000,
        totalAssets: 187000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Pharmaceuticals", "Medical Devices", "Consumer Health"],
        lastUpdated: "2024-01-15"
    },
    "UNH": {
        ticker: "UNH",
        name: "UnitedHealth Group",
        logo: "https://logo.clearbit.com/unitedhealthgroup.com",
        sector: "Healthcare",
        marketCap: 480000,
        totalDebt: 60000,
        cashAndEquivalents: 28000,
        deposits: 0,
        accountsReceivable: 14000,
        totalAssets: 273000,
        revenueBreakdown: { compliant: 85, questionable: 10, nonCompliant: 5 },
        businessActivities: ["Health Insurance", "Healthcare Services", "Pharmacy Benefits"],
        lastUpdated: "2024-01-15"
    },
    "PFE": {
        ticker: "PFE",
        name: "Pfizer Inc",
        logo: "https://logo.clearbit.com/pfizer.com",
        sector: "Healthcare",
        marketCap: 160000,
        totalDebt: 62000,
        cashAndEquivalents: 15000,
        deposits: 0,
        accountsReceivable: 10000,
        totalAssets: 220000,
        revenueBreakdown: { compliant: 96, questionable: 3, nonCompliant: 1 },
        businessActivities: ["Pharmaceuticals", "Vaccines", "Biotechnology"],
        lastUpdated: "2024-01-15"
    },
    "ABBV": {
        ticker: "ABBV",
        name: "AbbVie Inc",
        logo: "https://logo.clearbit.com/abbvie.com",
        sector: "Healthcare",
        marketCap: 310000,
        totalDebt: 60000,
        cashAndEquivalents: 12000,
        deposits: 0,
        accountsReceivable: 8000,
        totalAssets: 140000,
        revenueBreakdown: { compliant: 97, questionable: 2, nonCompliant: 1 },
        businessActivities: ["Pharmaceuticals", "Immunology", "Oncology"],
        lastUpdated: "2024-01-15"
    },
    "MRK": {
        ticker: "MRK",
        name: "Merck & Co Inc",
        logo: "https://logo.clearbit.com/merck.com",
        sector: "Healthcare",
        marketCap: 270000,
        totalDebt: 34000,
        cashAndEquivalents: 7000,
        deposits: 0,
        accountsReceivable: 9000,
        totalAssets: 106000,
        revenueBreakdown: { compliant: 98, questionable: 1, nonCompliant: 1 },
        businessActivities: ["Pharmaceuticals", "Vaccines", "Animal Health"],
        lastUpdated: "2024-01-15"
    },
    // Consumer Goods
    "PG": {
        ticker: "PG",
        name: "Procter & Gamble",
        logo: "https://logo.clearbit.com/pg.com",
        sector: "Consumer Defensive",
        marketCap: 380000,
        totalDebt: 34000,
        cashAndEquivalents: 10000,
        deposits: 0,
        accountsReceivable: 7000,
        totalAssets: 120000,
        revenueBreakdown: { compliant: 93, questionable: 1, nonCompliant: 6 },
        businessActivities: ["Consumer Products", "Personal Care", "Household Goods"],
        lastUpdated: "2024-01-15"
    },
    "COST": {
        ticker: "COST",
        name: "Costco Wholesale",
        logo: "https://logo.clearbit.com/costco.com",
        sector: "Consumer Defensive",
        marketCap: 360000,
        totalDebt: 9000,
        cashAndEquivalents: 13000,
        deposits: 0,
        accountsReceivable: 2500,
        totalAssets: 69000,
        revenueBreakdown: { compliant: 93, questionable: 5, nonCompliant: 2 },
        businessActivities: ["Retail", "Wholesale", "E-commerce"],
        lastUpdated: "2024-01-15"
    },
    "WMT": {
        ticker: "WMT",
        name: "Walmart Inc",
        logo: "https://logo.clearbit.com/walmart.com",
        sector: "Consumer Defensive",
        marketCap: 480000,
        totalDebt: 55000,
        cashAndEquivalents: 9000,
        deposits: 0,
        accountsReceivable: 8000,
        totalAssets: 252000,
        revenueBreakdown: { compliant: 92, questionable: 5, nonCompliant: 3 },
        businessActivities: ["Retail", "E-commerce", "Grocery"],
        lastUpdated: "2024-01-15"
    },
    "HD": {
        ticker: "HD",
        name: "The Home Depot",
        logo: "https://logo.clearbit.com/homedepot.com",
        sector: "Consumer Cyclical",
        marketCap: 380000,
        totalDebt: 45000,
        cashAndEquivalents: 3500,
        deposits: 0,
        accountsReceivable: 3200,
        totalAssets: 76000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Home Improvement", "Retail", "Building Materials"],
        lastUpdated: "2024-01-15"
    },
    "NKE": {
        ticker: "NKE",
        name: "Nike Inc",
        logo: "https://logo.clearbit.com/nike.com",
        sector: "Consumer Cyclical",
        marketCap: 150000,
        totalDebt: 9000,
        cashAndEquivalents: 10000,
        deposits: 0,
        accountsReceivable: 4500,
        totalAssets: 38000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Athletic Footwear", "Sports Apparel", "Equipment"],
        lastUpdated: "2024-01-15"
    },
    // Energy Stocks
    "XOM": {
        ticker: "XOM",
        name: "Exxon Mobil Corporation",
        logo: "https://logo.clearbit.com/exxonmobil.com",
        sector: "Energy",
        marketCap: 450000,
        totalDebt: 40000,
        cashAndEquivalents: 32000,
        deposits: 0,
        accountsReceivable: 27000,
        totalAssets: 377000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Oil & Gas Exploration", "Refining", "Chemicals"],
        lastUpdated: "2024-01-15"
    },
    "CVX": {
        ticker: "CVX",
        name: "Chevron Corporation",
        logo: "https://logo.clearbit.com/chevron.com",
        sector: "Energy",
        marketCap: 280000,
        totalDebt: 23000,
        cashAndEquivalents: 8000,
        deposits: 0,
        accountsReceivable: 17000,
        totalAssets: 261000,
        revenueBreakdown: { compliant: 96, questionable: 2, nonCompliant: 2 },
        businessActivities: ["Oil & Gas", "Refining", "Petrochemicals"],
        lastUpdated: "2024-01-15"
    },
    // Industrial
    "UPS": {
        ticker: "UPS",
        name: "United Parcel Service",
        logo: "https://logo.clearbit.com/ups.com",
        sector: "Industrials",
        marketCap: 120000,
        totalDebt: 20000,
        cashAndEquivalents: 4500,
        deposits: 0,
        accountsReceivable: 12000,
        totalAssets: 71000,
        revenueBreakdown: { compliant: 99, questionable: 1, nonCompliant: 0 },
        businessActivities: ["Package Delivery", "Logistics", "Supply Chain"],
        lastUpdated: "2024-01-15"
    },
    "HON": {
        ticker: "HON",
        name: "Honeywell International",
        logo: "https://logo.clearbit.com/honeywell.com",
        sector: "Industrials",
        marketCap: 140000,
        totalDebt: 17000,
        cashAndEquivalents: 10000,
        deposits: 0,
        accountsReceivable: 8000,
        totalAssets: 64000,
        revenueBreakdown: { compliant: 85, questionable: 10, nonCompliant: 5 },
        businessActivities: ["Aerospace", "Building Technologies", "Industrial Automation"],
        lastUpdated: "2024-01-15"
    },
    "DE": {
        ticker: "DE",
        name: "Deere & Company",
        logo: "https://logo.clearbit.com/deere.com",
        sector: "Industrials",
        marketCap: 120000,
        totalDebt: 50000,
        cashAndEquivalents: 7000,
        deposits: 0,
        accountsReceivable: 10000,
        totalAssets: 105000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Agricultural Machinery", "Construction Equipment", "Forestry"],
        lastUpdated: "2024-01-15"
    },
    // Communication
    "VZ": {
        ticker: "VZ",
        name: "Verizon Communications",
        logo: "https://logo.clearbit.com/verizon.com",
        sector: "Communication Services",
        marketCap: 170000,
        totalDebt: 150000,
        cashAndEquivalents: 4500,
        deposits: 0,
        accountsReceivable: 26000,
        totalAssets: 380000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Telecommunications", "Wireless Services", "Internet"],
        lastUpdated: "2024-01-15"
    },
    "T": {
        ticker: "T",
        name: "AT&T Inc",
        logo: "https://logo.clearbit.com/att.com",
        sector: "Communication Services",
        marketCap: 130000,
        totalDebt: 140000,
        cashAndEquivalents: 3500,
        deposits: 0,
        accountsReceivable: 17000,
        totalAssets: 407000,
        revenueBreakdown: { compliant: 94, questionable: 4, nonCompliant: 2 },
        businessActivities: ["Telecommunications", "Wireless", "Broadband"],
        lastUpdated: "2024-01-15"
    },
    "DIS": {
        ticker: "DIS",
        name: "The Walt Disney Company",
        logo: "https://logo.clearbit.com/disney.com",
        sector: "Communication Services",
        marketCap: 200000,
        totalDebt: 47000,
        cashAndEquivalents: 14000,
        deposits: 0,
        accountsReceivable: 12000,
        totalAssets: 205000,
        revenueBreakdown: { compliant: 88, questionable: 7, nonCompliant: 5 },
        businessActivities: ["Entertainment", "Media Networks", "Theme Parks", "Streaming"],
        lastUpdated: "2024-01-15"
    },
    // Financial Services (Non-Compliant)
    "V": {
        ticker: "V",
        name: "Visa Inc",
        logo: "https://logo.clearbit.com/visa.com",
        sector: "Financial Services",
        marketCap: 550000,
        totalDebt: 20000,
        cashAndEquivalents: 18000,
        deposits: 0,
        accountsReceivable: 4000,
        totalAssets: 91000,
        revenueBreakdown: { compliant: 70, questionable: 20, nonCompliant: 10 },
        businessActivities: ["Payment Processing", "Financial Technology", "Credit Networks"],
        lastUpdated: "2024-01-15"
    },
    "MA": {
        ticker: "MA",
        name: "Mastercard Inc",
        logo: "https://logo.clearbit.com/mastercard.com",
        sector: "Financial Services",
        marketCap: 440000,
        totalDebt: 14000,
        cashAndEquivalents: 8000,
        deposits: 0,
        accountsReceivable: 4000,
        totalAssets: 42000,
        revenueBreakdown: { compliant: 75, questionable: 15, nonCompliant: 10 },
        businessActivities: ["Payment Processing", "Financial Technology", "Credit Networks"],
        lastUpdated: "2024-01-15"
    },
    "GS": {
        ticker: "GS",
        name: "Goldman Sachs Group",
        logo: "https://logo.clearbit.com/goldmansachs.com",
        sector: "Financial Services",
        marketCap: 150000,
        totalDebt: 280000,
        cashAndEquivalents: 180000,
        deposits: 400000,
        accountsReceivable: 20000,
        totalAssets: 1600000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Investment Banking", "Trading", "Asset Management"],
        lastUpdated: "2024-01-15"
    },
    "BRK.B": {
        ticker: "BRK.B",
        name: "Berkshire Hathaway",
        logo: "https://logo.clearbit.com/berkshirehathaway.com",
        sector: "Financial Services",
        marketCap: 800000,
        totalDebt: 130000,
        cashAndEquivalents: 168000,
        deposits: 0,
        accountsReceivable: 80000,
        totalAssets: 1050000,
        revenueBreakdown: { compliant: 60, questionable: 25, nonCompliant: 15 },
        businessActivities: ["Insurance", "Investments", "Diversified Holdings"],
        lastUpdated: "2024-01-15"
    },
    // Additional Popular Stocks
    "SPOT": {
        ticker: "SPOT",
        name: "Spotify Technology",
        logo: "https://logo.clearbit.com/spotify.com",
        sector: "Communication Services",
        marketCap: 70000,
        totalDebt: 1500,
        cashAndEquivalents: 5000,
        deposits: 0,
        accountsReceivable: 800,
        totalAssets: 10000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Music Streaming", "Podcasts", "Audio Content"],
        lastUpdated: "2024-01-15"
    },
    "UBER": {
        ticker: "UBER",
        name: "Uber Technologies",
        logo: "https://logo.clearbit.com/uber.com",
        sector: "Technology",
        marketCap: 140000,
        totalDebt: 9000,
        cashAndEquivalents: 5500,
        deposits: 0,
        accountsReceivable: 4000,
        totalAssets: 42000,
        revenueBreakdown: { compliant: 96, questionable: 3, nonCompliant: 1 },
        businessActivities: ["Ride-Sharing", "Food Delivery", "Freight"],
        lastUpdated: "2024-01-15"
    },
    "ABNB": {
        ticker: "ABNB",
        name: "Airbnb Inc",
        logo: "https://logo.clearbit.com/airbnb.com",
        sector: "Consumer Cyclical",
        marketCap: 90000,
        totalDebt: 2000,
        cashAndEquivalents: 11000,
        deposits: 0,
        accountsReceivable: 500,
        totalAssets: 22000,
        revenueBreakdown: { compliant: 97, questionable: 2, nonCompliant: 1 },
        businessActivities: ["Short-Term Rentals", "Travel", "Hospitality Platform"],
        lastUpdated: "2024-01-15"
    },
    "SQ": {
        ticker: "SQ",
        name: "Block Inc (Square)",
        logo: "https://logo.clearbit.com/block.xyz",
        sector: "Financial Services",
        marketCap: 45000,
        totalDebt: 4000,
        cashAndEquivalents: 8000,
        deposits: 0,
        accountsReceivable: 1000,
        totalAssets: 30000,
        revenueBreakdown: { compliant: 75, questionable: 15, nonCompliant: 10 },
        businessActivities: ["Payment Processing", "Bitcoin", "Financial Services"],
        lastUpdated: "2024-01-15"
    },
    "SHOP": {
        ticker: "SHOP",
        name: "Shopify Inc",
        logo: "https://logo.clearbit.com/shopify.com",
        sector: "Technology",
        marketCap: 110000,
        totalDebt: 1000,
        cashAndEquivalents: 5000,
        deposits: 0,
        accountsReceivable: 500,
        totalAssets: 14000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["E-commerce Platform", "Payment Processing", "Merchant Services"],
        lastUpdated: "2024-01-15"
    },
    "ZM": {
        ticker: "ZM",
        name: "Zoom Video Communications",
        logo: "https://logo.clearbit.com/zoom.us",
        sector: "Technology",
        marketCap: 22000,
        totalDebt: 0,
        cashAndEquivalents: 6500,
        deposits: 0,
        accountsReceivable: 600,
        totalAssets: 10000,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Video Conferencing", "Collaboration Tools", "Cloud Communications"],
        lastUpdated: "2024-01-15"
    },
    "PLTR": {
        ticker: "PLTR",
        name: "Palantir Technologies",
        logo: "https://logo.clearbit.com/palantir.com",
        sector: "Technology",
        marketCap: 55000,
        totalDebt: 200,
        cashAndEquivalents: 4000,
        deposits: 0,
        accountsReceivable: 400,
        totalAssets: 5500,
        revenueBreakdown: { compliant: 70, questionable: 15, nonCompliant: 15 },
        businessActivities: ["Data Analytics", "AI Software", "Government Contracts"],
        lastUpdated: "2024-01-15"
    },
    "COIN": {
        ticker: "COIN",
        name: "Coinbase Global",
        logo: "https://logo.clearbit.com/coinbase.com",
        sector: "Financial Services",
        marketCap: 50000,
        totalDebt: 3400,
        cashAndEquivalents: 6500,
        deposits: 0,
        accountsReceivable: 400,
        totalAssets: 21000,
        revenueBreakdown: { compliant: 60, questionable: 25, nonCompliant: 15 },
        businessActivities: ["Cryptocurrency Exchange", "Digital Assets", "Blockchain"],
        lastUpdated: "2024-01-15"
    },
    // More Consumer Brands
    "CMG": {
        ticker: "CMG",
        name: "Chipotle Mexican Grill",
        logo: "https://logo.clearbit.com/chipotle.com",
        sector: "Consumer Cyclical",
        marketCap: 80000,
        totalDebt: 0,
        cashAndEquivalents: 1200,
        deposits: 0,
        accountsReceivable: 100,
        totalAssets: 8000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Fast-Casual Restaurants", "Food Service"],
        lastUpdated: "2024-01-15"
    },
    "LULU": {
        ticker: "LULU",
        name: "Lululemon Athletica",
        logo: "https://logo.clearbit.com/lululemon.com",
        sector: "Consumer Cyclical",
        marketCap: 45000,
        totalDebt: 700,
        cashAndEquivalents: 800,
        deposits: 0,
        accountsReceivable: 100,
        totalAssets: 5500,
        revenueBreakdown: { compliant: 100, questionable: 0, nonCompliant: 0 },
        businessActivities: ["Athletic Apparel", "Yoga Clothing", "Accessories"],
        lastUpdated: "2024-01-15"
    },
    // More BDS Listed
    "PEP": {
        ticker: "PEP",
        name: "PepsiCo Inc",
        logo: "https://logo.clearbit.com/pepsico.com",
        sector: "Consumer Defensive",
        marketCap: 230000,
        totalDebt: 44000,
        cashAndEquivalents: 6000,
        deposits: 0,
        accountsReceivable: 10000,
        totalAssets: 94000,
        revenueBreakdown: { compliant: 94, questionable: 4, nonCompliant: 2 },
        businessActivities: ["Beverages", "Snacks", "Food Products"],
        lastUpdated: "2024-01-15"
    },
    "INTC": {
        ticker: "INTC",
        name: "Intel Corporation",
        logo: "https://logo.clearbit.com/intel.com",
        sector: "Technology",
        marketCap: 90000,
        totalDebt: 50000,
        cashAndEquivalents: 25000,
        deposits: 0,
        accountsReceivable: 4000,
        totalAssets: 190000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Semiconductors", "Processors", "Data Centers"],
        lastUpdated: "2024-01-15"
    },
    // Real Estate
    "AMT": {
        ticker: "AMT",
        name: "American Tower Corp",
        logo: "https://logo.clearbit.com/americantower.com",
        sector: "Real Estate",
        marketCap: 100000,
        totalDebt: 40000,
        cashAndEquivalents: 2000,
        deposits: 0,
        accountsReceivable: 2500,
        totalAssets: 70000,
        revenueBreakdown: { compliant: 98, questionable: 2, nonCompliant: 0 },
        businessActivities: ["Cell Tower Infrastructure", "Real Estate Investment Trust"],
        lastUpdated: "2024-01-15"
    },
    // Automotive
    "F": {
        ticker: "F",
        name: "Ford Motor Company",
        logo: "https://logo.clearbit.com/ford.com",
        sector: "Consumer Cyclical",
        marketCap: 45000,
        totalDebt: 140000,
        cashAndEquivalents: 26000,
        deposits: 0,
        accountsReceivable: 8000,
        totalAssets: 275000,
        revenueBreakdown: { compliant: 92, questionable: 5, nonCompliant: 3 },
        businessActivities: ["Automobiles", "Electric Vehicles", "Commercial Vehicles"],
        lastUpdated: "2024-01-15"
    },
    "GM": {
        ticker: "GM",
        name: "General Motors",
        logo: "https://logo.clearbit.com/gm.com",
        sector: "Consumer Cyclical",
        marketCap: 55000,
        totalDebt: 115000,
        cashAndEquivalents: 20000,
        deposits: 0,
        accountsReceivable: 12000,
        totalAssets: 276000,
        revenueBreakdown: { compliant: 93, questionable: 4, nonCompliant: 3 },
        businessActivities: ["Automobiles", "Electric Vehicles", "Autonomous Driving"],
        lastUpdated: "2024-01-15"
    },
    "TM": {
        ticker: "TM",
        name: "Toyota Motor Corporation",
        logo: "https://logo.clearbit.com/toyota.com",
        sector: "Consumer Cyclical",
        marketCap: 230000,
        totalDebt: 180000,
        cashAndEquivalents: 55000,
        deposits: 0,
        accountsReceivable: 75000,
        totalAssets: 680000,
        revenueBreakdown: { compliant: 95, questionable: 3, nonCompliant: 2 },
        businessActivities: ["Automobiles", "Hybrid Vehicles", "Commercial Vehicles"],
        lastUpdated: "2024-01-15"
    },
    // Alcohol/Haram (Non-Compliant)
    "BUD": {
        ticker: "BUD",
        name: "Anheuser-Busch InBev",
        logo: "https://logo.clearbit.com/ab-inbev.com",
        sector: "Consumer Defensive",
        marketCap: 120000,
        totalDebt: 80000,
        cashAndEquivalents: 8000,
        deposits: 0,
        accountsReceivable: 5000,
        totalAssets: 210000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Alcoholic Beverages", "Beer Production", "Alcohol Sales"],
        lastUpdated: "2024-01-15"
    },
    "DEO": {
        ticker: "DEO",
        name: "Diageo PLC",
        logo: "https://logo.clearbit.com/diageo.com",
        sector: "Consumer Defensive",
        marketCap: 80000,
        totalDebt: 18000,
        cashAndEquivalents: 2500,
        deposits: 0,
        accountsReceivable: 4000,
        totalAssets: 50000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Alcoholic Beverages", "Spirits", "Wine"],
        lastUpdated: "2024-01-15"
    },
    // Tobacco (Non-Compliant)
    "PM": {
        ticker: "PM",
        name: "Philip Morris International",
        logo: "https://logo.clearbit.com/pmi.com",
        sector: "Consumer Defensive",
        marketCap: 150000,
        totalDebt: 42000,
        cashAndEquivalents: 3000,
        deposits: 0,
        accountsReceivable: 5000,
        totalAssets: 65000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Tobacco Products", "Cigarettes", "Heated Tobacco"],
        lastUpdated: "2024-01-15"
    },
    "MO": {
        ticker: "MO",
        name: "Altria Group",
        logo: "https://logo.clearbit.com/altria.com",
        sector: "Consumer Defensive",
        marketCap: 85000,
        totalDebt: 26000,
        cashAndEquivalents: 1500,
        deposits: 0,
        accountsReceivable: 100,
        totalAssets: 38000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Tobacco Products", "Cigarettes", "Smokeless Tobacco"],
        lastUpdated: "2024-01-15"
    },
    // Gambling (Non-Compliant)
    "LVS": {
        ticker: "LVS",
        name: "Las Vegas Sands",
        logo: "https://logo.clearbit.com/sands.com",
        sector: "Consumer Cyclical",
        marketCap: 35000,
        totalDebt: 14000,
        cashAndEquivalents: 3000,
        deposits: 0,
        accountsReceivable: 1000,
        totalAssets: 24000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Casinos", "Gambling", "Hotels"],
        lastUpdated: "2024-01-15"
    },
    "MGM": {
        ticker: "MGM",
        name: "MGM Resorts International",
        logo: "https://logo.clearbit.com/mgmresorts.com",
        sector: "Consumer Cyclical",
        marketCap: 14000,
        totalDebt: 6000,
        cashAndEquivalents: 5500,
        deposits: 0,
        accountsReceivable: 700,
        totalAssets: 40000,
        revenueBreakdown: { compliant: 0, questionable: 0, nonCompliant: 100 },
        businessActivities: ["Casinos", "Gambling", "Entertainment"],
        lastUpdated: "2024-01-15"
    },
}

// Screening threshold (AAOIFI standard: 30%)
const THRESHOLD = 30

export function calculateQuantitativeRatios(stock: Stock): {
    debtRatio: number
    securitiesRatio: number
    liquidityRatio: number
} {
    const debtRatio = (stock.totalDebt / stock.marketCap) * 100
    const securitiesRatio = ((stock.cashAndEquivalents + stock.deposits) / stock.marketCap) * 100
    const liquidityRatio = ((stock.cashAndEquivalents + stock.accountsReceivable) / stock.totalAssets) * 100

    return {
        debtRatio: Math.round(debtRatio * 100) / 100,
        securitiesRatio: Math.round(securitiesRatio * 100) / 100,
        liquidityRatio: Math.round(liquidityRatio * 100) / 100,
    }
}

export function checkBDSStatus(ticker: string): boolean {
    return bdsBoycottList.includes(ticker.toUpperCase())
}

export function screenStock(ticker: string): ScreeningResult | null {
    const stock = stockDatabase[ticker.toUpperCase()]
    if (!stock) return null

    const isBDSListed = checkBDSStatus(ticker)
    const ratios = calculateQuantitativeRatios(stock)

    // Quantitative screening
    const debtPassed = ratios.debtRatio < THRESHOLD
    const securitiesPassed = ratios.securitiesRatio < THRESHOLD
    const liquidityPassed = ratios.liquidityRatio < THRESHOLD
    const quantitativePassed = debtPassed && securitiesPassed && liquidityPassed

    // Qualitative screening
    const qualitativeIssues: string[] = []

    // Check revenue breakdown
    const qualitativePassed = stock.revenueBreakdown.nonCompliant < 5 &&
        stock.revenueBreakdown.questionable < 5

    if (stock.revenueBreakdown.nonCompliant >= 5) {
        qualitativeIssues.push(`Non-compliant revenue exceeds 5% threshold (${stock.revenueBreakdown.nonCompliant}%)`)
    }

    // Check for haram activities
    stock.businessActivities.forEach(activity => {
        if (haramActivities.some(haram => activity.toLowerCase().includes(haram.toLowerCase()))) {
            qualitativeIssues.push(`Engages in: ${activity}`)
        }
    })

    // Check BDS status
    if (isBDSListed) {
        qualitativeIssues.push("Listed on BDS Boycott List - supports Israeli occupation")
    }

    // Determine overall status
    // Rule 1: If ANY quantitative ratio fails -> Non-Compliant
    // Rule 2: If quantitative passes but qualitative has issues -> depends on severity
    // Rule 3: "Questionable" only when quantitative passes but business activities are questionable
    let overallStatus: "Compliant" | "Questionable" | "Non-Compliant"
    const isShariahCompliant = qualitativePassed && quantitativePassed && !isBDSListed

    if (!quantitativePassed) {
        // If any quantitative ratio fails, it's Non-Compliant
        overallStatus = "Non-Compliant"
    } else if (isBDSListed) {
        // BDS listed is always Non-Compliant
        overallStatus = "Non-Compliant"
    } else if (stock.sector === "Financial Services") {
        // Financial services (banks, insurance) are Non-Compliant
        overallStatus = "Non-Compliant"
    } else if (stock.businessActivities.some(a =>
        a.toLowerCase().includes("weapons") ||
        a.toLowerCase().includes("alcohol") ||
        a.toLowerCase().includes("tobacco") ||
        a.toLowerCase().includes("gambling") ||
        a.toLowerCase().includes("casino")
    )) {
        // Haram business activities are Non-Compliant
        overallStatus = "Non-Compliant"
    } else if (stock.revenueBreakdown.nonCompliant >= 5) {
        // More than 5% non-compliant revenue is Non-Compliant
        overallStatus = "Non-Compliant"
    } else if (stock.revenueBreakdown.questionable > 3 || stock.revenueBreakdown.nonCompliant > 0) {
        // Quantitative passes, but some questionable/minor non-compliant revenue
        overallStatus = "Questionable"
    } else if (isShariahCompliant) {
        overallStatus = "Compliant"
    } else {
        overallStatus = "Questionable"
    }

    return {
        ticker: stock.ticker,
        name: stock.name,
        logo: stock.logo,
        sector: stock.sector,
        isShariahCompliant,
        isBDSListed,
        businessActivities: stock.businessActivities,
        lastUpdated: stock.lastUpdated,
        qualitative: {
            passed: qualitativePassed && !isBDSListed,
            compliantPercent: stock.revenueBreakdown.compliant,
            questionablePercent: stock.revenueBreakdown.questionable,
            nonCompliantPercent: stock.revenueBreakdown.nonCompliant,
            issues: qualitativeIssues,
        },
        quantitative: {
            passed: quantitativePassed,
            debtRatio: ratios.debtRatio,
            securitiesRatio: ratios.securitiesRatio,
            liquidityRatio: ratios.liquidityRatio,
            debtPassed,
            securitiesPassed,
            liquidityPassed,
        },
        rawData: {
            marketCap: stock.marketCap,
            totalDebt: stock.totalDebt,
            cashAndEquivalents: stock.cashAndEquivalents,
            deposits: stock.deposits,
            accountsReceivable: stock.accountsReceivable,
            totalAssets: stock.totalAssets,
        },
        overallStatus,
    }
}

export function searchStocks(query: string): string[] {
    const upperQuery = query.toUpperCase()
    return Object.keys(stockDatabase).filter(ticker =>
        ticker.includes(upperQuery) ||
        stockDatabase[ticker].name.toLowerCase().includes(query.toLowerCase())
    )
}

export function getAvailableStocks(): string[] {
    return Object.keys(stockDatabase)
}
