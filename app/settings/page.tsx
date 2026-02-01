"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, ShieldCheck, CreditCard, User, Mail, Sparkles } from "lucide-react"
import { usePaywall } from "@/hooks/use-paywall"
import { Badge } from "@/components/ui/badge"

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia",
    "United Arab Emirates", "Saudi Arabia", "Malaysia", "Singapore",
    "Pakistan", "India", "Indonesia", "Germany", "France", "other"
]

export default function SettingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const { isPremium, setPaywallOpen, isLoading: isPlanLoading, checkSubscription } = usePaywall()

    // Form State
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [country, setCountry] = useState("")
    const [phone, setPhone] = useState("")
    const [username, setUsername] = useState("")
    const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
                router.push('/login')
                return
            }

            setUser(user)
            const meta = user.user_metadata || {}
            setFirstName(meta.first_name || "")
            setLastName(meta.last_name || "")
            setCountry(meta.country || "")
            setPhone(meta.phone || "")
            setUsername(meta.username || "")

            setLoading(false)
        }
        getUser()
    }, [router])

    useEffect(() => {
        checkSubscription()
    }, [checkSubscription])

    useEffect(() => {
        if (searchParams.get('recovery') === '1') {
            setShowRecoveryBanner(true)
            router.replace('/settings')
        }
    }, [searchParams, router])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const updates = {
            username: username,
            first_name: firstName,
            last_name: lastName,
            country: country,
            phone: phone
        }

        const { error } = await supabase.auth.updateUser({
            data: updates
        })

        if (error) {
            toast.error("Failed to update profile: " + error.message)
        } else {
            toast.success("Profile updated successfully!")
            router.refresh()
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            {/* Header Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                            <User className="h-8 w-8 text-green-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                            <p className="text-muted-foreground text-sm">Manage your profile and subscription</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {showRecoveryBanner && (
                    <div className="border border-green-200 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm">
                        Password recovery mode is active. Please update your password below.
                    </div>
                )}

                {/* Subscription Card */}
                <Card className="border-l-4 border-l-green-600 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-green-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    Current Plan
                                </CardTitle>
                                <CardDescription>Your subscription status and billing cycle.</CardDescription>
                            </div>
                            <Badge
                                variant={isPlanLoading ? "outline" : (isPremium ? "default" : "outline")}
                                className={
                                    isPlanLoading
                                        ? "bg-gray-100 text-gray-600 border-gray-300"
                                        : (isPremium ? "bg-green-600" : "bg-gray-100 text-gray-600 border-gray-300")
                                }
                            >
                                {isPlanLoading ? "Checking Plan..." : (isPremium ? "Premium Member" : "Free Plan")}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-6 items-center border p-4 rounded-lg bg-gray-50/50">
                            <div className="flex-1 space-y-1">
                                <h4 className="font-semibold text-sm">
                                    {isPlanLoading ? "Checking subscription..." : (isPremium ? "You have full access" : "Upgrade to unlock full access")}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    {isPlanLoading
                                        ? "Please wait while we confirm your plan status."
                                        : (isPremium
                                            ? "Enjoy unlimited screenings, portfolios, and deep-dive analytics."
                                            : "You are currently on the limited Free tier. Upgrade to remove limits."
                                        )
                                    }
                                </p>
                            </div>
                            {isPlanLoading ? (
                                <Button size="sm" variant="outline" disabled className="shrink-0 h-8 text-xs">
                                    Checking...
                                </Button>
                            ) : isPremium ? (
                                <Button size="sm" variant="outline" onClick={async () => {
                                    try {
                                        toast.loading("Redirecting to billing portal...")
                                        const res = await fetch('/api/create-portal-session', {
                                            method: 'POST',
                                        })
                                        const data = await res.json()
                                        if (data.url) {
                                            window.location.href = data.url
                                        } else {
                                            toast.error(data.error?.message || "Failed to load portal")
                                        }
                                    } catch (e) {
                                        toast.error("Something went wrong")
                                    }
                                }} className="text-gray-700 border-gray-300 hover:bg-gray-100 shrink-0 h-8 text-xs">
                                    Manage Subscription
                                </Button>
                            ) : (
                                <Button size="sm" onClick={() => setPaywallOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                                    Upgrade to Premium
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Form */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-gray-400" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Investor123"
                                        className="pl-9 bg-gray-50/50"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground pl-1">This will be displayed on your dashboard.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Omar"
                                        className="bg-gray-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Ali"
                                        className="bg-gray-50/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        disabled
                                        value={user?.email}
                                        className="pl-9 bg-gray-100/50 text-muted-foreground"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground pl-1">Contact support to change your email.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country of Residence</Label>
                                    <Select value={country} onValueChange={setCountry}>
                                        <SelectTrigger className="bg-gray-50/50">
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COUNTRIES.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                        className="bg-gray-50/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t mt-6">
                                <p className="text-xs text-muted-foreground">
                                    Last updated: {new Date().toLocaleDateString()}
                                </p>
                                <Button type="submit" disabled={saving} className="min-w-[120px] bg-gray-900 hover:bg-gray-800">
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-gray-400" />
                            Security
                        </CardTitle>
                        <CardDescription>Update your password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const password = (form.elements.namedItem('password') as HTMLInputElement).value
                            const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value

                            if (password !== confirm) {
                                toast.error("Passwords do not match")
                                return
                            }

                            if (password.length < 6) {
                                toast.error("Password must be at least 6 characters")
                                return
                            }

                            toast.promise(supabase.auth.updateUser({ password }), {
                                loading: 'Updating password...',
                                success: () => {
                                    form.reset()
                                    return 'Password updated successfully!'
                                },
                                error: (err) => err.message
                            })
                        }} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" name="password" type="password" required placeholder="••••••••" minLength={6} className="bg-gray-50/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm Password</Label>
                                <Input id="confirm" name="confirm" type="password" required placeholder="••••••••" minLength={6} className="bg-gray-50/50" />
                            </div>
                            <Button type="submit" variant="outline" className="w-full">
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
