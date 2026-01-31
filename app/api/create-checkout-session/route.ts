import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    // Lazy init
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    try {
        const { plan } = await request.json()
        const origin = request.headers.get('origin') || 'http://localhost:3000'

        if (plan !== 'monthly' && plan !== 'yearly') {
            return NextResponse.json(
                { error: { message: 'Invalid plan. Must be monthly or yearly.' } },
                { status: 400 }
            )
        }

        // Define Price Data based on plan
        // In a real app, you might use Price IDs (e.g., price_123) from Stripe Dashboard
        // Here we use ad-hoc price_data for easiest setup
        const priceData = {
            currency: 'usd',
            product_data: {
                name: plan === 'yearly' ? 'MyRizq Premium (Yearly)' : 'MyRizq Premium (Monthly)',
                description: 'Unlimited Access to Halal Screener & Portfolio Tools',
            },
            unit_amount: plan === 'yearly' ? 5000 : 499, // $50.00 or $4.99 in cents
            recurring: {
                interval: plan === 'yearly' ? 'year' as const : 'month' as const,
            },
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: { message: 'You must be logged in to subscribe.' } },
                { status: 401 }
            )
        }

        // Check if the user already used a trial
        let trialUsed = false
        const { data: subRow, error: subRowError } = await supabase
            .from('subscriptions')
            .select('trial_used,status')
            .eq('user_id', user.id)
            .maybeSingle()

        if (subRowError) {
            // Fallback if trial_used column isn't available yet
            const { data: subFallback } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle()
            trialUsed = !!subFallback?.status
        } else {
            trialUsed = !!subRow?.trial_used
        }

        const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
            metadata: {
                userId: user.id
            }
        }
        if (!trialUsed) {
            subscriptionData.trial_period_days = 7 // 7-Day Free Trial
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            client_reference_id: user.id,
            customer_email: user.email ?? undefined,
            line_items: [
                {
                    price_data: priceData,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: subscriptionData,
            metadata: {
                userId: user.id // Also put on session for easy access
            },
            // Stripe will replace {CHECKOUT_SESSION_ID} with the real id
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout?canceled=true`,
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (err: any) {
        console.error('Stripe Error:', err)
        return NextResponse.json(
            { error: { message: err?.message || 'An unknown error occurred with Stripe.' } },
            { status: 500 }
        )
    }
}
