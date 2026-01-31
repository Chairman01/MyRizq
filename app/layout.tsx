import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Toaster } from "@/components/ui/sonner"
import { PricingModal } from "@/components/paywall/pricing-modal"
import { SubscriptionChecker } from "@/components/paywall/subscription-checker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'Making finance easy for Muslims',
  description: 'Making finance easy for Muslims',
  keywords: 'Halal ETF, Shariah compliant investing, Islamic finance, SPUS, HLAL, Muslim investing, ethical ETF, halal stocks',
  icons: {
    icon: '/Favicon/favicon-32x32.png',
    apple: '/Favicon/apple-touch-icon.png',
  },
  generator: 'Next.js',
  alternates: {
    canonical: 'https://myrizq.com',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Making finance easy for Muslims',
    description: 'Making finance easy for Muslims',
    type: 'website',
    url: 'https://myrizq.com',
    siteName: 'MyRizq',
    images: [
      {
        url: 'https://myrizq.com/myrizq-og.png',
        width: 1200,
        height: 630,
        alt: 'MyRizq - Helping Muslims Navigate Finance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Making finance easy for Muslims',
    description: 'Making finance easy for Muslims',
    images: ['https://myrizq.com/myrizq-og.png'],
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
        <SubscriptionChecker />
        <PricingModal />
      </body>
    </html>
  )
}
