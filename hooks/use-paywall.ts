'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PaywallState {
    etfViews: number
    searches: number
    isLimitReached: boolean
    isPaywallOpen: boolean
    isPremium: boolean
    incrementEtfView: () => void
    incrementSearch: () => void
    setPaywallOpen: (open: boolean) => void
    upgradeToPremium: () => void
    downgradeToFree: () => void
    reset: () => void
}

export const usePaywall = create<PaywallState>()(
    persist(
        (set, get) => ({
            etfViews: 0,
            searches: 0,
            isLimitReached: false,
            isPaywallOpen: false,
            isPremium: false,
            incrementEtfView: () => {
                const { isPremium, etfViews } = get()
                if (isPremium) return // No limits for premium

                const current = etfViews + 1
                // Limit: 2 views
                if (current > 2) {
                    set({ isLimitReached: true, isPaywallOpen: true })
                }
                set({ etfViews: current })
            },
            incrementSearch: () => {
                const { isPremium, searches } = get()
                if (isPremium) return // No limits for premium

                const current = searches + 1
                // Limit: 3 searches
                if (current > 3) {
                    set({ isLimitReached: true, isPaywallOpen: true })
                }
                set({ searches: current })
            },
            setPaywallOpen: (open) => set({ isPaywallOpen: open }),
            upgradeToPremium: () => set({ isPremium: true, isLimitReached: false, isPaywallOpen: false }),
            downgradeToFree: () => set({ isPremium: false }),
            reset: () => set({ etfViews: 0, searches: 0, isLimitReached: false, isPaywallOpen: false }),
        }),
        {
            name: 'myrizq-usage-storage-v2',
        }
    )
)
