import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// User ID from screenshot: Ali Omar / aabdihal@ualberta.ca
const userId = '6e6d30af-16c8-4f78-bd4c-4f9abf1be8d7'

async function run() {
    console.log(`Fixing subscription for ${userId} using Service Role...`)

    // Check existing
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (existing) {
        console.log("Subscription already exists:", existing)
        return
    }

    // Insert
    const { error } = await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'active',
        plan_id: 'premium',
        current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        stripe_customer_id: 'manual_fix_cus_123',
        stripe_subscription_id: 'manual_fix_sub_123'
    })

    if (error) {
        console.error('Manual fix failed:', error)
    } else {
        console.log('Success! Subscription added.')
    }
}

run()
