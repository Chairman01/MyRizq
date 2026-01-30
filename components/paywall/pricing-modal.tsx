'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, Heart } from 'lucide-react'
import Link from 'next/link'
import { usePaywall } from '@/hooks/use-paywall'
import { usePathname, useRouter } from 'next/navigation'

import { startTransition, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function PricingModal() {
    const { isPaywallOpen, setPaywallOpen } = usePaywall()
    const pathname = usePathname()
    const router = useRouter()
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'monthly' | 'yearly'>('monthly')

    // Don't show paywall on login or register pages
    const isOpen = isPaywallOpen && !pathname?.startsWith('/login')

    const [user, setUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()
    }, [])

    const handleAction = () => {
        setPaywallOpen(false) // Close modal before navigation

        if (!user) {
            // If not logged in, force register first -> then to checkout
            const nextUrl = selectedPlan === 'free' ? '/portfolio' : `/checkout?plan=${selectedPlan}`
            router.push(`/login?tab=register&next=${encodeURIComponent(nextUrl)}&plan=${selectedPlan}`)
            return
        }

        if (selectedPlan === 'free') {
            // Already logged in, just go to portfolio or stay
            // checking if they are eligible for free plan is handled by backend logic/limits usually
            router.push('/portfolio')
        } else {
            router.push(`/checkout?plan=${selectedPlan}`)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setPaywallOpen}>
            <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader className="text-center pb-4">
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">
                        Unlock Full Access
                    </DialogTitle>
                    <DialogDescription className="text-base text-gray-600">
                        You&apos;ve reached your free usage limit. Creating an account helps us build more tools for the Ummah.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Plan Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                            onClick={() => setSelectedPlan('free')}
                            className={`rounded-lg border p-3 cursor-pointer transition-all ${selectedPlan === 'free' ? 'border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2' : 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-100'}`}
                        >
                            <div className="text-xs font-medium text-gray-500">Free</div>
                            <div className="text-xl font-bold text-gray-900">$0</div>
                            <div className="mt-1 text-[10px] text-red-500 font-medium leading-none">Limit Reached</div>
                        </div>
                        <div
                            onClick={() => setSelectedPlan('monthly')}
                            className={`rounded-lg border-2 p-3 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-green-600 bg-green-50/50 ring-2 ring-green-600 ring-offset-2' : 'border-green-100 bg-green-50/50 hover:border-green-500'}`}
                        >
                            <div className="text-xs font-medium text-gray-500">Monthly</div>
                            <div className="text-xl font-bold text-gray-900">$4.99<span className="text-[10px] font-normal text-gray-500">/mo</span></div>
                            <div className="mt-1 text-[10px] text-green-700 font-medium">Flexible</div>
                        </div>
                        <div
                            onClick={() => setSelectedPlan('yearly')}
                            className={`relative rounded-lg border-2 p-3 shadow-sm transition-all cursor-pointer ${selectedPlan === 'yearly' ? 'border-green-600 bg-green-50 ring-2 ring-green-600 ring-offset-2' : 'border-green-100 bg-green-50/30 hover:shadow-md'}`}
                        >
                            <div className={`absolute -top-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedPlan === 'yearly' ? 'bg-green-600' : 'bg-gray-400'}`}>
                                BEST
                            </div>
                            <div className="text-xs font-medium text-gray-500">Yearly</div>
                            <div className="text-xl font-bold text-gray-900">$50<span className="text-[10px] font-normal text-gray-500">/yr</span></div>
                            <div className="mt-1 text-[10px] text-green-700 font-medium">Save ~16% • 7-Day Free Trial</div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <h4 className="text-sm font-semibold text-gray-900">What you get with {selectedPlan === 'free' ? 'Free' : 'Pro'}:</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                            {selectedPlan === 'free' ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-gray-400" /> Limited Search (3 Transactions)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-gray-400" /> Basic Portfolio Tracking
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Community Access
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> <strong>7-Day Free Trial Included</strong>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Unlimited ETF & Stock Lookups
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Advanced Portfolio Tools
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Support Future Features
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-100">
                        <div className="flex items-start gap-2">
                            <Heart className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500 leading-relaxed">
                                We want to make Halal investing accessible to everyone. If the price is too high for you right now, please <a href="mailto:support@myrizq.com" className="underline text-green-600 hover:text-green-700">email us</a> and we will get you access at a price that works for you. InshaAllah we want to build more tools and features for you.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        onClick={handleAction}
                        className="w-full bg-green-600 hover:bg-green-700 h-11 text-base"
                    >
                        {selectedPlan === 'free' ? 'Create Free Account' : 'Start 7-Day Free Trial'}
                    </Button>
                    <div className="text-center">
                        <Link href="/login" className="text-xs text-gray-400 hover:text-gray-900 underline">
                            Already have an account? Log In
                        </Link>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
