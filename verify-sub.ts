import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

async function checkSub() {
    // Ali Omar's ID from screenshot
    const userId = '6e6d30af-16c8-4f78-bd4c-4f9abf1be8d7'

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)

    console.log('Subscription for Ali Omar:', data)
    console.log('Error:', error)
}

checkSub()
