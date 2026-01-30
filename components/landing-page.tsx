"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, PieChart, Briefcase, GitCompare, LineChart, BookOpen, Shield, TrendingUp, Globe, Lightbulb, ChevronLeft, ChevronRight, CheckCircle2, MessageSquarePlus, Coffee, Heart, Star, ArrowRight } from "lucide-react"

const features = [
    { icon: Search, title: "Stock Screener", description: "Instant Shariah compliance check for global stocks", href: "/screener" },
    { icon: PieChart, title: "ETF Explorer", description: "Browse Shariah-compliant ETFs with full holdings data", href: "/etfs" },
    { icon: Briefcase, title: "Portfolio Builder", description: "Build your custom Halal investment portfolio", href: "/portfolio" },
    { icon: GitCompare, title: "Comparison Tool", description: "Compare ETFs side-by-side on performance & fees", href: "/compare" },
    { icon: LineChart, title: "Market Analytics", description: "Visual insights into market trends and sectors", href: "/analytics" },
    { icon: BookOpen, title: "Islamic Finance Blog", description: "Learn about Halal investing and Zakat guides", href: "/blog" },
]

const testimonials = [
    {
        name: "Naiem",
        rating: 5,
        text: "Very good product MashaAllah, will refer to my friends and family. It has made managing my finances according to Islamic principles so much easier."
    },
    {
        name: "Raheem",
        rating: 5,
        text: "This is a very good way to help the Ummah, may Allah reward you guys for your efforts! The Zakat calculator is especially helpful."
    },
    {
        name: "Fatima",
        rating: 5,
        text: "Finally a platform that makes Halal investing accessible! The ETF comparison tool saved me hours of research. JazakAllah Khair!"
    },
    {
        name: "Ahmed",
        rating: 5,
        text: "I've been looking for something like this for years. The portfolio builder is exactly what I needed to organize my Shariah-compliant investments."
    },
    {
        name: "Yusuf",
        rating: 5,
        text: "The best resource for Muslim investors! I love how easy it is to compare different Halal ETFs side by side. Highly recommended!"
    },
    {
        name: "Aisha",
        rating: 5,
        text: "As a beginner in investing, MyRizq has been invaluable. The educational content helped me understand Islamic finance principles."
    },
    {
        name: "Omar",
        rating: 5,
        text: "Subhanallah, this is exactly what our Ummah needed. The portfolio tracker helps me stay on top of my Shariah-compliant investments."
    },
    {
        name: "Khadija",
        rating: 5,
        text: "I recommend MyRizq to everyone in my community. It's user-friendly and makes Halal investing accessible to everyone. Barakallahu feekum!"
    }
]

const companies = [
    { name: "Wahed", logo: "/logo-wahed.png" },
    { name: "Wealthsimple", logo: "/logo-wealthsimple.png" },
    { name: "Sharia", logo: "/logo-sharia.png" },
    { name: "iShares", logo: "/logo-ishares.png" },
    { name: "Manzil", logo: "/logo-manzil.png" },
    { name: "Invesco", logo: "/logo-invesco.png" },
]

const taglines = [
    "Your Rizq in One Place",
    "Helping Muslims Navigate Finance",
    "Your Guide to Halal Investing",
    "Shariah-Compliant ETF Research",
]

function TypingEffect() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [displayText, setDisplayText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentTagline = taglines[currentIndex]
        const speed = isDeleting ? 15 : 40

        if (!isDeleting && displayText === currentTagline) {
            setTimeout(() => setIsDeleting(true), 1500)
            return
        }

        if (isDeleting && displayText === "") {
            setIsDeleting(false)
            setCurrentIndex((prev) => (prev + 1) % taglines.length)
            return
        }

        const timer = setTimeout(() => {
            setDisplayText(prev =>
                isDeleting
                    ? currentTagline.substring(0, prev.length - 1)
                    : currentTagline.substring(0, prev.length + 1)
            )
        }, speed)

        return () => clearTimeout(timer)
    }, [displayText, isDeleting, currentIndex])

    return (
        <span className="text-green-600">
            {displayText}
            <span className="animate-pulse">|</span>
        </span>
    )
}

function TestimonialsCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const testimonialsPerView = 2

    const nextSlide = () => {
        setCurrentIndex((prev) =>
            prev + testimonialsPerView >= testimonials.length ? 0 : prev + testimonialsPerView
        )
    }

    const prevSlide = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? Math.max(0, testimonials.length - testimonialsPerView) : prev - testimonialsPerView
        )
    }

    const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + testimonialsPerView)

    return (
        <div className="relative">
            <div className="grid md:grid-cols-2 gap-6">
                {visibleTestimonials.map((testimonial, i) => (
                    <Card key={currentIndex + i} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            {/* Star Rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, idx) => (
                                    <Star key={idx} className="w-5 h-5 fill-green-500 text-green-500" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                "{testimonial.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-sm">
                                        {testimonial.name.charAt(0)}
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900">{testimonial.name}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Previous testimonials"
            >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Next testimonials"
            >
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
        </div>
    )
}

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50 via-white to-white relative overflow-hidden">
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34,197,94,0.15) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />

            {/* Hero Section */}
            <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm border border-green-100 text-green-700 text-sm font-medium mb-8 animate-fade-in">
                        <Image src="/myrizq-logo.png" alt="MyRizq" width={80} height={24} className="h-5 w-auto" />
                    </div>

                    {/* Typing Tagline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 min-h-[1.5em]">
                        <TypingEffect />
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-fade-in-up">
                        Discover, compare, and learn about Shariah-compliant Stocks, ETFs, Sukuks, and more.
                        Your comprehensive resource for halal investing.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up w-full sm:w-auto px-4 sm:px-0">
                        <Link href="/etfs" className="w-full sm:w-auto">
                            <Button size="lg" className="h-14 w-full sm:w-auto px-8 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 gap-2 transition-all duration-300 hover:scale-105">
                                Explore Halal ETFs <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/screener" className="w-full sm:w-auto">
                            <Button size="lg" className="h-14 w-full sm:w-auto px-8 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 gap-2 transition-all duration-300 hover:scale-105">
                                Find Halal Stock
                            </Button>
                        </Link>
                        <Link href="/portfolio" className="w-full sm:w-auto">
                            <Button size="lg" className="h-14 w-full sm:w-auto px-8 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 gap-2 transition-all duration-300 hover:scale-105">
                                Build Your Portfolio
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Stats */}
                    <div className="flex justify-center items-center gap-6 md:gap-12 mt-12 text-sm md:text-base text-gray-500 font-medium animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Review of all Halal ETFs
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Global Stock Analysis
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Shariah-Compliant Data
                        </div>
                    </div>
                </div>
            </section >

            {/* Testimonials Section */}
            < section className="relative py-16 bg-gray-50/50" >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <span className="text-green-600 text-sm font-medium uppercase tracking-wider">Testimonials</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">What users are saying</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Join thousands of satisfied Muslims managing their finances with MyRizq
                        </p>
                    </div>

                    <TestimonialsCarousel />
                </div>
            </section >

            {/* Companies We Review */}
            < section className="relative py-10 bg-white/80 backdrop-blur-sm border-y border-gray-100 overflow-hidden" >
                <div className="max-w-6xl mx-auto px-4 text-center mb-6">
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Companies We Review</p>
                </div>
                <div className="relative">
                    <div className="flex animate-scroll gap-16 items-center">
                        {[...companies, ...companies, ...companies].map((company, i) => (
                            <div key={i} className="flex-shrink-0 h-16 w-40 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                <Image
                                    src={company.logo}
                                    alt={company.name}
                                    width={160}
                                    height={64}
                                    className="max-h-12 w-auto object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* Stock Screener Spotlight (Moved) */}
            < section className="relative py-20 bg-gradient-to-br from-green-50/50 to-white overflow-hidden" >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Left: Text & Features */}
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
                                <Search className="w-4 h-4" /> New Feature
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Instant Halal Stock Screener
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Not sure if a stock is Halal? Our advanced screener analyzes financial reports in real-time to check for Shariah compliance based on AAOIFI standards.
                            </p>

                            <div className="space-y-6 mb-8">
                                {[
                                    { title: "Financial Ratio Analysis", desc: "Checks Debt/Market Cap & Liquidity ratios (<30%)" },
                                    { title: "Business Activity Screening", desc: "Filters out revenue from alcohol, pork, gambling, etc." },
                                    { title: "Real-time Compliance Status", desc: "Get an instant Compliant, Questionable, or Non-Compliant verdict" }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                            <p className="text-sm text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/screener">
                                <Button size="lg" className="h-12 px-8 rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 gap-2 transition-all hover:scale-105">
                                    Try Stock Screener <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Right: Visual Mock */}
                        <div className="order-1 lg:order-2 relative">
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-200/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>

                            <Card className="relative bg-white border-gray-100 shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                                <CardContent className="p-0">
                                    {/* Mock Header */}
                                    <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">AAPL</h3>
                                            <p className="text-sm text-gray-500">Apple Inc.</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Compliant
                                        </div>
                                    </div>

                                    {/* Mock Body */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                            <span className="text-gray-600">Business Sector</span>
                                            <span className="font-medium">Technology</span>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Financial Screening</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Interest-bearing Debt</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">1.5%</span>
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '5%' }}></div>
                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-sm text-gray-600">Interest-bearing Securities</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">2.8%</span>
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mock Filter */}
                                    <div className="bg-green-50/50 p-4 border-t border-green-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        </div>
                                        <p className="text-xs text-green-800 font-medium">Passes AAOIFI Shariah Standards</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section >

            {/* ETF Summary Tool Preview */}
            < section className="relative py-20 bg-gray-50/50" >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Halal ETF Summary Tool</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Compare performance, fees, and holdings of all Shariah-compliant ETFs in one place.
                        </p>
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                        {/* Visual Mock Table Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 shadow-2xl bg-white/80 backdrop-blur-xl transform hover:scale-[1.01] transition-all duration-500">

                            {/* Mock Header */}
                            <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-2">Ticker</div>
                                <div className="col-span-6">ETF Name</div>
                                <div className="col-span-2 text-right">AUM</div>
                                <div className="col-span-2 text-right">Return (1Y)</div>
                            </div>

                            {/* Mock Rows */}
                            {[
                                { t: "SPUS", n: "SP Funds S&P 500 Sharia Industry Exclusions", a: "$2.0B", r: "+28.4%", c: "bg-green-100 text-green-700" },
                                { t: "HLAL", n: "Wahed FTSE USA Sharia ETF", a: "$730M", r: "+26.1%", c: "bg-blue-100 text-blue-700" },
                                { t: "SPTE", n: "SP Funds S&P Global Technology ETF", a: "$93M", r: "+35.2%", c: "bg-purple-100 text-purple-700" },
                                { t: "ISDW", n: "iShares MSCI World Islamic UCITS ETF", a: "$1.1B", r: "+18.9%", c: "bg-orange-100 text-orange-700" },
                                { t: "SPSK", n: "SP Funds Dow Jones Global Sukuk ETF", a: "$460M", r: "+4.5%", c: "bg-gray-100 text-gray-700" },
                            ].map((row, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-50 hover:bg-green-50/30 transition-colors items-center group">
                                    <div className="col-span-2">
                                        <span className={`px-2.5 py-1 rounded-md text-sm font-bold ${row.c}`}>{row.t}</span>
                                    </div>
                                    <div className="col-span-6 text-sm text-gray-700 font-medium truncate group-hover:text-green-700 transition-colors">{row.n}</div>
                                    <div className="col-span-2 text-right text-sm text-gray-500">{row.a}</div>
                                    <div className="col-span-2 text-right text-sm font-bold text-green-600">{row.r}</div>
                                </div>
                            ))}

                            {/* Gradient Overlay for "More" hint */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none flex items-end justify-center pb-8">
                                <Link href="/etfs">
                                    <Button className="rounded-full shadow-lg bg-white text-green-600 hover:bg-green-50 border border-green-100 px-8 py-6 text-base font-semibold pointer-events-auto transition-top hover:-translate-y-1">
                                        View All 16+ Halal ETFs
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Soft glow behind */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-green-200/20 to-blue-200/20 blur-3xl -z-10 rounded-full"></div>
                    </div>
                </div>
            </section >




            {/* Features Grid (Moved) */}
            <section className="relative py-20 lg:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <span className="text-green-600 text-sm font-medium uppercase tracking-wider">Our Ecosystem</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">All in one Muslim Finance APP</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Comprehensive research tools and education designed for the modern Muslim investor.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <Link key={f.title} href={f.href}>
                                <Card
                                    className="h-full bg-white/60 backdrop-blur-md border border-white/50 shadow-lg shadow-gray-200/50 hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 group cursor-pointer hover:-translate-y-2"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                            <f.icon className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{f.title}</h3>
                                        <p className="text-sm text-gray-500">{f.description}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Request + Support Section */}
            < section className="relative py-16 bg-gray-50 border-t border-gray-100" >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Feature Request */}
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-4">
                                <MessageSquarePlus className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Have a Feature Idea?</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Help us build a better MyRizq. Share your ideas!
                            </p>
                            <Link href="/feedback">
                                <Button className="rounded-full gap-2 bg-green-600 hover:bg-green-700 transition-all duration-300">
                                    <MessageSquarePlus className="w-4 h-4" /> Submit Idea
                                </Button>
                            </Link>
                        </div>

                        {/* Buy Me a Coffee */}
                        <div className="text-center p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-amber-100">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4">
                                <Coffee className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Support MyRizq</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                If MyRizq has helped you, consider buying us a coffee!
                            </p>
                            <a href="https://buymeacoffee.com/myrizq3l" target="_blank" rel="noopener noreferrer">
                                <Button className="rounded-full gap-2 bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300">
                                    <Heart className="w-4 h-4" /> Buy Me a Coffee
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section >

            {/* Final CTA */}
            < section className="relative py-20 bg-white" >
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Start Your Halal Investing Journey
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Explore our comprehensive database of Shariah-compliant ETFs today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/etfs">
                            <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 gap-2 transition-all duration-300 hover:scale-105">
                                Explore ETFs <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/support">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 gap-2 transition-all duration-300">
                                ❤️ Support Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section >

            {/* CSS for animations */}
            < style jsx global > {`
            @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
            }
            .animate-scroll {
            animation: scroll 20s linear infinite;
            }
            @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
            }
            @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
            animation: fade-in 0.6s ease-out;
            }
            .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
            }
        `}</style >
        </div >
    )
}
