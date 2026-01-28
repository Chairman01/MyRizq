"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import confetti from "canvas-confetti"
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
  ChevronRight,
  Search
} from "lucide-react"
import { ETFComparisonTable } from "@/components/etf-comparison-table"
import { etfData } from "@/lib/etf-data"

const features = [
  { icon: Search, title: "Stock Screener", description: "Instant Shariah compliance check for global stocks", href: "/screener" },
  { icon: PieChart, title: "ETF Explorer", description: "Browse Shariah-compliant ETFs with full holdings data", href: "/etfs" },
  { icon: Briefcase, title: "Portfolio Builder", description: "Build your custom Halal investment portfolio", href: "/portfolio" },
  { icon: GitCompare, title: "Comparison Tool", description: "Compare ETFs side-by-side on performance & fees", href: "/compare" },
  { icon: LineChart, title: "Market Analytics", description: "Visual insights into market trends and sectors", href: "/analytics" },
  { icon: BookOpen, title: "Islamic Finance Blog", description: "Learn about Halal investing and Zakat guides", href: "/blog" },
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

import { createClient } from "@/utils/supabase/client"
import { LandingPage } from "@/components/landing-page"
import { DashboardHome } from "@/components/dashboard-home"

export default function HomePage() {
  return (
    <LandingPage />
  )
}


