import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

interface PaywallState {
    etfViews: number
    searches: number
    isLimitReached: boolean
    isPaywallOpen: boolean
    isPremium: boolean
    isLoading: boolean
    checkSubscription: () => Promise<void>
    incrementEtfView: () => void
    incrementSearch: () => void
    setPaywallOpen: (open: boolean) => void
    reset: () => void
}

import { persist } from 'zustand/middleware'

export const usePaywall = create<PaywallState>()(
    persist(
        (set, get) => ({
            etfViews: 0,
            searches: 0,
            isLimitReached: false,
            isPaywallOpen: false,
            isPremium: false,
            isLoading: true,

            checkSubscription: async () => {
                const supabase = createClient()
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError || !user) {
                    set({ isPremium: false, isLoading: false })
                    return
                }

                const { data: sub, error: subError } = await supabase
                    .from('subscriptions')
                    .select('status,current_period_end')
                    .eq('user_id', user.id)
                    .in('status', ['active', 'trialing'])
                    .maybeSingle()

                if (subError) {
                    set({ isPremium: false, isLoading: false })
                    return
                }

                const nowMs = Date.now()
                const hasActive = sub?.status === 'active'
                const hasValidTrial = sub?.status === 'trialing'
                    && !!sub?.current_period_end
                    && Date.parse(sub.current_period_end) > nowMs

                if (hasActive || hasValidTrial) {
                    set({ isPremium: true, isLimitReached: false, isPaywallOpen: false, isLoading: false })
                } else {
                    set({ isPremium: false, isLoading: false })
                }
            },

            incrementEtfView: () => {
                const { isPremium, etfViews } = get()
                if (isPremium) return

                const current = etfViews + 1
                if (current > 3) {
                    set({ isLimitReached: true, isPaywallOpen: true })
                }
                set({ etfViews: current })
            },

            incrementSearch: () => {
                const { isPremium, searches } = get()
                if (isPremium) return

                const current = searches + 1
                if (current > 2) {
                    set({ isLimitReached: true, isPaywallOpen: true })
                }
                set({ searches: current })
            },

            setPaywallOpen: (open) => set({ isPaywallOpen: open }),
            reset: () => set({ etfViews: 0, searches: 0, isLimitReached: false, isPaywallOpen: false }),
        }),
        {
            name: 'paywall-storage',
            partialize: (state) => ({ etfViews: state.etfViews, searches: state.searches }),
        }
    )
)
