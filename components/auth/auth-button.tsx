'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UserNav } from './user-nav'
import { User } from '@supabase/supabase-js'

export function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return <div className="h-10 w-20 animate-pulse bg-gray-100 rounded-md" /> // Loading skeleton
    }

    if (user) {
        return <UserNav email={user.email} />
    }

    return (
        <div className="flex items-center gap-2">
            <Link href="/login">
                <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login?tab=register">
                <Button className="bg-green-600 hover:bg-green-700">Sign Up</Button>
            </Link>
        </div>
    )
}
