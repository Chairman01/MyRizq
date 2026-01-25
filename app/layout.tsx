import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'MyRizq - Helping Muslims Navigate their Finances',
  description: 'Discover, compare, and learn about Shariah-compliant Stocks, ETFs, Sukuks, and more. Your comprehensive resource for halal investing.',
  keywords: 'Halal ETF, Shariah compliant investing, Islamic finance, SPUS, HLAL, Muslim investing, ethical ETF, halal stocks',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'MyRizq - Halal ETF Research Platform',
    description: 'Your trusted source for Shariah-compliant ETF research and Islamic finance education.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
