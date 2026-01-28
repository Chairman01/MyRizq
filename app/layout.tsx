import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Toaster } from "@/components/ui/sonner"
import { PricingModal } from "@/components/paywall/pricing-modal"
import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'MyRizq - Helping Muslims Navigate Finance',
  description: 'Discover, compare, and learn about Shariah-compliant Stocks, ETFs, Sukuks, and more. Your comprehensive resource for halal investing.',
  keywords: 'Halal ETF, Shariah compliant investing, Islamic finance, SPUS, HLAL, Muslim investing, ethical ETF, halal stocks',
  generator: 'Next.js',
  icons: {
    icon: '/custom-favicon.png',
    apple: '/custom-favicon.png',
  },
  openGraph: {
    title: 'MyRizq - Halal ETF Research Platform',
    description: 'Your trusted source for Shariah-compliant ETF research and Islamic finance education.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {user ? (
          <DashboardLayout user={user}>
            {children}
          </DashboardLayout>
        ) : (
          <>
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </>
        )}
        <Analytics />
        <Toaster />
        <PricingModal />
      </body>
    </html>
  )
}
