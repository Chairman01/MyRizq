"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShieldCheck, CreditCard, Loader2 } from "lucide-react"
import { Suspense, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { loadStripe } from "@stripe/stripe-js"

function CheckoutContent() {
    const searchParams = useSearchParams()
    const plan = searchParams.get("plan") || "monthly"

    // UI Helpers
    const isYearly = plan === "yearly"
    const priceLabel = isYearly ? "$50.00 / year" : "$4.99 / month"
    const billingPeriod = isYearly ? "Yearly" : "Monthly"

    const [userId, setUserId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id)
        })
    }, [])

    const handleSubscribe = async () => {
        if (!userId) {
            window.location.href = "/login?next=/checkout"
            return
        }

        setIsProcessing(true)
        try {
            // 1. Create Checkout Session via API
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plan }),
            })

            const data = await response.json()
            console.log('Checkout Response:', { status: response.status, data })

            const { sessionId, error } = data

            if (error) {
                console.error('Checkout error:', JSON.stringify(error, null, 2))
                setIsProcessing(false)
                return
            }

            // 2. Redirect to Stripe (Server-side URL)
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL returned from server')
            }
        } catch (err) {
            console.error('Payment Error:', err)
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-700">
                        <ShieldCheck className="w-6 h-6" /> MyRizq
                    </Link>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> Secure Checkout
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-12 grid md:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Start your 7-Day Free Trial</h1>
                        <p className="text-gray-600">You won't be charged today. Cancel anytime during the trial.</p>
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium text-gray-500 uppercase tracking-wide">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-4 border-b">
                                <div>
                                    <p className="font-bold text-lg">MyRizq Premium ({billingPeriod})</p>
                                    <p className="text-sm text-gray-500">7-Day Free Trial</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{priceLabel}</p>
                                    <p className="text-sm text-green-600 font-medium">Free for 7 days</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Due Today</span>
                                <span>$0.00</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 p-4 rounded-b-lg">
                            <p className="text-xs text-gray-500">
                                After your 7-day trial ends, you will be charged <strong>{priceLabel}</strong>.
                                You can cancel at any time from your account settings to avoid being charged.
                            </p>
                        </CardFooter>
                    </Card>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Unlimited Stock & ETF Lookups</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Unlimited Portfolio Assets</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Priority Support</span>
                        </div>
                    </div>
                </div>

                {/* Payment Placeholder */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>Enter your payment information to start the trial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-gray-50 text-center space-y-2">
                            <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                            <p className="text-xs text-gray-500">
                                Processed securely by Stripe
                            </p>
                        </div>

                        <Button onClick={handleSubscribe} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 h-11 text-base">
                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</> : 'Start Trial & Subscribe'}
                        </Button>
                        <p className="text-[10px] text-center text-gray-400">
                            You will be redirected to the secure checkout page.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    )
}
