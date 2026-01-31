import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    // Lazy init to avoid build-time errors if env vars are missing
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia' as any,
    })

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    const body = await req.text()
    const headerPayload = await headers()
    const signature = headerPayload.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!signature) {
            return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return NextResponse.json({ error: err.message }, { status: 400 })
    }

    function toIsoFromUnixSeconds(value?: number | null) {
        if (!value || typeof value !== 'number') return null
        return new Date(value * 1000).toISOString()
    }

    async function findUserIdByCustomerId(stripeCustomerId?: string | null): Promise<string | null> {
        if (!stripeCustomerId) return null
        const { data } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', stripeCustomerId)
            .maybeSingle()
        return (data?.user_id as string | undefined) ?? null
    }

    async function upsertSubscriptionRow(args: {
        userId: string
        status: string
        planId: string
        stripeCustomerId: string | null
        stripeSubscriptionId: string
        currentPeriodEndIso: string | null
        trialUsed: boolean
    }) {
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .upsert(
                {
                    user_id: args.userId,
                    status: args.status,
                    plan_id: args.planId,
                    current_period_end: args.currentPeriodEndIso,
                    trial_used: args.trialUsed,
                    stripe_customer_id: args.stripeCustomerId,
                    stripe_subscription_id: args.stripeSubscriptionId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            )

        if (error) throw error
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const stripeSubscriptionId = session.subscription as string | null

            // Check metadata first, then client_reference_id (standard field)
            let userId = (session.metadata?.userId as string | undefined) || (session.client_reference_id ?? undefined)
            const stripeCustomerId = (session.customer as string | null) ?? null

            if (!stripeSubscriptionId) {
                return NextResponse.json({ received: true })
            }

            if (!userId) {
                userId = (await findUserIdByCustomerId(stripeCustomerId)) ?? undefined
            }

            if (!userId) {
                console.warn('checkout.session.completed missing userId; cannot sync subscription', {
                    stripeSubscriptionId,
                    stripeCustomerId,
                })
                return NextResponse.json({ received: true })
            }

            // Fetch the full subscription to get the correct status and plan details
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
            const interval = sub.items.data?.[0]?.price?.recurring?.interval
            const planId = interval === 'year' ? 'yearly' : 'monthly'
            const trialUsed = !!(sub as any).trial_start || !!(sub as any).trial_end

            await upsertSubscriptionRow({
                userId,
                status: sub.status,
                planId,
                stripeCustomerId: (sub.customer as string | null) ?? stripeCustomerId,
                stripeSubscriptionId: sub.id,
                currentPeriodEndIso: toIsoFromUnixSeconds((sub as any).current_period_end),
                trialUsed,
            })

            return NextResponse.json({ received: true })
        }

        if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription
            const stripeCustomerId = subscription.customer as string
            const stripeSubscriptionId = subscription.id
            const status = subscription.status
            const currentPeriodEndIso = toIsoFromUnixSeconds((subscription as any).current_period_end)
            const trialUsed = !!(subscription as any).trial_start || !!(subscription as any).trial_end

            // Determine Plan ID from interval (consistent with checkout session logic)
            const interval = subscription.items.data[0]?.price?.recurring?.interval
            const planId = interval === 'year' ? 'yearly' : 'monthly'

            // We need userId to upsert.
            let userId: string | undefined = subscription.metadata?.userId

            // Fallback: Find user by customer ID if metadata is missing
            if (!userId) {
                userId = await findUserIdByCustomerId(stripeCustomerId) ?? undefined
            }

            if (!userId) {
                console.warn(`Webhook ${event.type} missing userId`, { stripeSubscriptionId })
                return NextResponse.json({ received: true })
            }

            await upsertSubscriptionRow({
                userId,
                status,
                planId,
                stripeCustomerId,
                stripeSubscriptionId,
                currentPeriodEndIso,
                trialUsed
            })

            return NextResponse.json({ received: true })
        }

        return NextResponse.json({ received: true })

    } catch (err: any) {
        console.error('Webhook Handler Error:', err)
        return NextResponse.json(
            { error: `Webhook Handler Error: ${err.message}` },
            { status: 500 }
        )
    }
}
