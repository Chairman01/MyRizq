"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePaywall } from "@/hooks/use-paywall"
import confetti from "canvas-confetti"
import { useSearchParams, useRouter } from "next/navigation"

export default function SuccessPage() {
    const { upgradeToPremium } = usePaywall()
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionId = searchParams.get("session_id")

    useEffect(() => {
        if (!sessionId) {
            // Security: If no session_id from Stripe, do not upgrade.
            // Redirect home.
            router.push('/')
            return
        }

        // Activate Premium ONLY if verified (mock verification by presence of ID)
        upgradeToPremium()

        // Celebrate
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        })
    }, [upgradeToPremium, sessionId, router])

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full border-0 shadow-2xl overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">MyRizq Premium</h1>
                    <p className="text-green-100 font-medium">Upgrade Successful!</p>
                </div>

                <CardContent className="p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-gray-600 text-lg">
                            JazakAllah Khair! You now have unlimited access to all features on MyRizq.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-2xl font-bold text-green-600">∞</span>
                            <span className="text-xs text-gray-500">Unlimited Search</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-2xl font-bold text-green-600">✓</span>
                            <span className="text-xs text-gray-500">Full Portfolio</span>
                        </div>
                    </div>

                    <Link href="/">
                        <Button className="w-full h-12 text-lg rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 gap-2 transition-all hover:scale-105">
                            Go to Dashboard <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
