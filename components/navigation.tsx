"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  Home,
  LineChart,
  BookOpen,
  PieChart,
  Heart,
  GitCompare,
  Briefcase,
} from "lucide-react"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/etfs", label: "ETFs", icon: PieChart },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/blog", label: "Learn", icon: BookOpen },
]

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/myrizq-logo.png"
              alt="MyRizq"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="gap-2">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Support Button - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/support">
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Heart className="w-4 h-4" />
                Support Us
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="pt-2 border-t border-border mt-2">
                <Link href="/support" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full gap-2 bg-gradient-to-r from-primary to-accent">
                    <Heart className="w-4 h-4" />
                    Support Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
