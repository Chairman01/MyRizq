'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/portfolio')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const plan = (formData.get('plan') as string) || 'free'
    const nextPath = plan === 'free' ? '/portfolio' : `/checkout?plan=${encodeURIComponent(plan)}`

    const data = {
        email: (formData.get('email') as string).toLowerCase(),
        password: formData.get('password') as string,
        options: {
            data: {
                username: formData.get('username'),
                first_name: formData.get('firstName'),
                last_name: formData.get('lastName'),
                country: formData.get('country'),
                phone: formData.get('phone'),
                plan,
            },
            emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        }
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        console.log("Signup Error:", error)
        if (error.message.includes("already registered") || error.code === 'user_already_exists') {
            console.log("User exists, attempting to resend OTP...")
            const resendResult = await resendOtp(data.email)
            if (resendResult.error) {
                return { error: "This email is registered. Please login." }
            }
            return { success: true, message: "Account exists! Verification code sent." }
        }
        return { error: error.message }
    }

    // Do not redirect, return success so UI can show message
    return { success: true, message: 'Verification code sent to email.' }
}

export async function verifyOtp(email: string, token: string) {
    const supabase = await createClient()
    email = email.toLowerCase()
    console.log(`Verifying: ${email} with token: ${token}`)

    // Try 'signup' first (most common for new users)
    let { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
    })

    // If 'signup' fails, try 'email' (sometimes used for generic verification)
    if (error) {
        console.log("Signup verify failed:", error.message)
        const res2 = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })
        error = res2.error
    }

    // If both fail, try 'recovery' (just in case)
    if (error) {
        console.log("Email verify failed:", error.message)
        const res3 = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        })
        error = res3.error
    }

    if (error) {
        console.log("All verifications failed:", error.message)
        return { error: error.message }
    }

    return { success: true }
}

export async function resendOtp(email: string) {
    const supabase = await createClient()
    email = email.toLowerCase()

    // Use signInWithOtp which works for both new and existing users
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false
        }
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'New code sent!' }
}

export async function resetPassword(email: string) {
    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/settings?recovery=1')}`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Password reset link sent to email.' }
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function tempFixSubscription(userId: string) {
    // Use Service Role to bypass RLS
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if sub exists
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (existing) return { message: "Already exists" }

    // Manually insert premium sub
    const { error } = await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'active',
        plan_id: 'premium',
        current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
        stripe_customer_id: 'manual_fix_cus_123',
        stripe_subscription_id: 'manual_fix_sub_123'
    })

    if (error) {
        console.error('Manual fix failed:', error)
        return { error: error.message }
    }

    return { success: true }
}
