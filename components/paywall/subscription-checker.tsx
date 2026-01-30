'use client'

import { useEffect } from 'react'
import { usePaywall } from '@/hooks/use-paywall'

export function SubscriptionChecker() {
    const { checkSubscription } = usePaywall()

    useEffect(() => {
        checkSubscription()
    }, [checkSubscription])

    return null
}
