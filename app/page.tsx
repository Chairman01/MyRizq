"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  PieChart,
  LineChart,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  GitCompare,
  Shield,
  TrendingUp,
  Globe,
  Lightbulb,
  MessageSquarePlus,
  Coffee,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

const features = [
  { icon: PieChart, title: "ETF Explorer", description: "Browse Shariah-compliant ETFs with full holdings data", href: "/etfs" },
  { icon: GitCompare, title: "Compare", description: "Side-by-side comparison of sectors & holdings", href: "/compare" },
  { icon: Briefcase, title: "Portfolio Builder", description: "Build your custom Halal investment portfolio", href: "/portfolio" },
  { icon: LineChart, title: "Analytics", description: "Rankings, expense ratios, and performance data", href: "/analytics" },
]

const benefits = [
  { icon: Shield, title: "100% Shariah Compliant", description: "All ETFs certified by recognized Shariah boards" },
  { icon: TrendingUp, title: "Performance Tracking", description: "Track YTD, 1Y, 3Y, and since-inception returns" },
  { icon: Globe, title: "Global Coverage", description: "ETFs listed in US, UK, and international markets" },
  { icon: Lightbulb, title: "Free Education", description: "Learn about Islamic finance and Halal investing" },
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
  "Helping Muslims Navigate their Finances",
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white relative overflow-hidden">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Link href="/etfs">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 gap-2 transition-all duration-300 hover:scale-105">
                Explore ETFs <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 border-gray-200 hover:border-green-200 hover:bg-green-50 gap-2 transition-all duration-300">
                Compare ETFs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 bg-gray-50/50">
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
      </section>

      {/* Features Grid */}
      <section className="relative py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Research tools and education designed for Muslim investors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Link key={f.title} href={f.href}>
                <Card
                  className="h-full bg-white/80 backdrop-blur-sm border-gray-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-500 group cursor-pointer hover:-translate-y-1"
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

      {/* Companies We Review */}
      <section className="relative py-10 bg-white/80 backdrop-blur-sm border-y border-gray-100 overflow-hidden">
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
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why MyRizq?</h2>
            <p className="text-green-100 max-w-xl mx-auto">
              We built MyRizq because finding Halal investing info shouldn't be difficult
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-green-100 text-sm">{b.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/etfs">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-green-600 hover:bg-green-50 shadow-lg gap-2 transition-all duration-300 hover:scale-105">
                Browse All ETFs <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-3xl p-8 md:p-12 border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  What's Included - <span className="text-green-600">Free</span>
                </h2>
                <ul className="space-y-4">
                  {[
                    "Full ETF holdings data with weights",
                    "Performance comparisons across timeframes",
                    "Broker info - where to buy each ETF",
                    "Sector allocation breakdowns",
                    "Educational articles on Islamic finance",
                    "No account required - instant access"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <Card className="bg-white p-6 shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Learning Center</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Videos and articles on Halal investing</p>
                  <Link href="/blog" className="text-green-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Start Learning <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
                <Card className="bg-white p-6 shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Portfolio Builder</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Build & save your custom ETF portfolio</p>
                  <Link href="/portfolio" className="text-green-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Build Portfolio <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Request + Support Section */}
      <section className="relative py-16 bg-gray-50 border-t border-gray-100">
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
      </section>

      {/* Final CTA */}
      <section className="relative py-20 bg-white">
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
      </section>

      {/* CSS for animations */}
      <style jsx global>{`
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
      `}</style>
    </div>
  )
}
