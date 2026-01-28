"use client"

import { DashboardHome } from "@/components/dashboard-home"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import confetti from "canvas-confetti"

export default function DashboardPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [showPremiumWelcome, setShowPremiumWelcome] = useState(false)

    useEffect(() => {
        if (searchParams.get('payment') === 'success') {
            setShowPremiumWelcome(true)
            toast.success("Welcome to Premium! 🚀", {
                description: "You now have unlimited access to all features.",
                duration: 5000,
            })

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })

            // Clean URL but stay on dashboard
            router.replace('/dashboard')
        }
    }, [searchParams, router])

    return (
        <>
            {showPremiumWelcome && (
                <div className="bg-green-600 text-white text-center py-2 px-4 animate-fade-in-up mb-4 rounded-lg shadow-sm mx-4 mt-4">
                    <span className="font-bold">🎉 Upgrade Successful!</span> You are now a Premium Member.
                </div>
            )}
            <DashboardHome />
        </>
    )
}
