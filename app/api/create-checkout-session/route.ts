import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia', // Use latest API version available
})

export async function POST(request: Request) {
    try {
        const { plan } = await request.json()
        const origin = request.headers.get('origin') || 'http://localhost:3000'

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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: priceData,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 7, // 7-Day Free Trial
            },
            success_url: `${origin}/success`,
            cancel_url: `${origin}/checkout?canceled=true`,
        })

        return NextResponse.json({ sessionId: session.id })
    } catch (err: any) {
        console.error('Stripe Error:', err)
        return NextResponse.json(
            { error: { message: err.message } },
            { status: 500 }
        )
    }
}
