import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    // Lazy init
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia' as any,
    })

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: { message: 'You must be logged in.' } },
                { status: 401 }
            )
        }

        // Get the subscription to find the customer ID
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json(
                { error: { message: 'No active subscription found.' } },
                { status: 404 }
            )
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000'

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${origin}/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err: any) {
        console.error('Portal Error:', err)
        return NextResponse.json(
            { error: { message: err.message } },
            { status: 500 }
        )
    }
}
