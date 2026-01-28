"use client"

import Link from 'next/link'
import { useTransition, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Loader2, ArrowLeft, Globe, Phone, User, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { login, signup, verifyOtp, resendOtp, resetPassword } from './actions'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

const QUOTES = [
    { text: "The best investment you can make is in yourself, and doing it in a way that aligns with your values.", source: "MyRizq Team" },
    { text: "Simplicity is a part of faith.", source: "Prophet Muhammad (ﷺ) - Sunan Abi Dawud" },
    { text: "Wealth is not in having many possessions, but rather wealth is the richness of the soul.", source: "Prophet Muhammad (ﷺ) - Bukhari & Muslim" }
]

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia",
    "Malaysia", "Indonesia", "Saudi Arabia", "United Arab Emirates",
    "Qatar", "Pakistan", "India", "Singapore", "Turkey", "Germany", "France", "Other"
]

export default function LoginPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
    const planParam = searchParams.get('plan')

    // Form and UI State
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'monthly' | 'yearly'>(
        (planParam as 'free' | 'monthly' | 'yearly') || 'free'
    )
    const [selectedCountry, setSelectedCountry] = useState("")
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [isPending, startTransition] = useTransition()

    // OTP Verification State
    const [isVerifying, setIsVerifying] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [verifyEmail, setVerifyEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [resendTimer, setResendTimer] = useState(0)

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    // ... (other hooks)

    const handleResend = () => {
        startTransition(async () => {
            const result = await resendOtp(verifyEmail)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('New code sent!')
                setResendTimer(60) // 60 second cooldown
            }
        })
    }

    useEffect(() => {
        if (planParam) setSelectedPlan(planParam as any)
    }, [planParam])

    const [googleLoading, setGoogleLoading] = useState(false)
    const [quote, setQuote] = useState(QUOTES[0])

    useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }, [])

    const supabase = createClient()

    const handleLogin = (formData: FormData) => {
        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Logged in successfully!')
            }
        })
    }

    const handleSignup = (formData: FormData) => {
        if (!agreedToTerms) {
            toast.error("You must agree to the Terms & Conditions")
            return
        }

        const email = formData.get('email') as string
        setVerifyEmail(email)

        startTransition(async () => {
            const result = await signup(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                // Switch to Verification Mode
                setIsVerifying(true)
                toast.success('Verification code sent! Please check your email.', { duration: 5000 })
            }
        })
    }

    const handleVerify = () => {
        if (otpCode.length < 6) {
            toast.error("Please enter a valid code")
            return
        }

        startTransition(async () => {
            // Try client-side verification directly
            const email = verifyEmail.toLowerCase()

            // Try 'email' first (Standard Login Code)
            let { error } = await supabase.auth.verifyOtp({
                email,
                token: otpCode,
                type: 'email'
            })

            // If that fails, try 'signup' (Just in case unverified)
            if (error) {
                console.log("Client email verify failed, trying signup type...")
                const res2 = await supabase.auth.verifyOtp({
                    email,
                    token: otpCode,
                    type: 'signup'
                })
                if (!res2.error) error = null
                else error = res2.error
            }

            if (error) {
                toast.error("Invalid Code: " + error.message)
            } else {
                // Success!
                // Refresh router to update server components with new session
                router.refresh()

                if (selectedPlan === 'free') {
                    toast.success('Account verified!', { duration: 4000 })
                    router.push('/portfolio')
                } else {
                    toast.success('Account verified! Redirecting to payment...', { duration: 4000 })
                    router.push(`/checkout?plan=${selectedPlan}`)
                }
            }
        })
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            toast.error(error.message)
            setGoogleLoading(false)
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="mx-auto w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome</h1>
                        <p className="text-sm text-gray-500">
                            Login or Create an account to manage your Halal Portfolio
                        </p>
                    </div>

                    <Tabs defaultValue={defaultTab} className="w-full">
                        {!isVerifying && (
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">Register</TabsTrigger>
                            </TabsList>
                        )}

                        <TabsContent value="login" className="space-y-4">
                            {isForgotPassword ? (
                                <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold">Reset Password</h3>
                                        <p className="text-sm text-gray-500">
                                            Enter your email and we'll send you a link to reset your password.
                                        </p>
                                    </div>

                                    <form action={async (formData) => {
                                        startTransition(async () => {
                                            const email = formData.get('email') as string
                                            const result = await resetPassword(email)
                                            if (result?.error) {
                                                toast.error(result.error)
                                            } else {
                                                toast.success('Reset link sent! Check your email.')
                                                setIsForgotPassword(false)
                                            }
                                        })
                                    }} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email">Email</Label>
                                            <Input id="reset-email" name="email" type="email" required placeholder="m.ali@example.com" />
                                        </div>
                                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold" disabled={isPending}>
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                                        </Button>
                                    </form>

                                    <div className="text-center">
                                        <button onClick={() => setIsForgotPassword(false)} className="text-sm text-gray-500 hover:text-gray-900 underline">
                                            Back to Login
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={handleGoogleLogin} disabled={googleLoading || isPending} className="w-full">
                                        {googleLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                        )}
                                        Continue with Google
                                    </Button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-muted-foreground">Or password</span>
                                        </div>
                                    </div>


                                    <form action={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" required placeholder="m.ali@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">Password</Label>
                                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-green-600 hover:underline">
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <Input id="password" name="password" type="password" required />
                                        </div>
                                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold" disabled={isPending}>
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </TabsContent>


                        <TabsContent value="register" className="space-y-4">
                            {/* OTP Verification UI */}
                            {isVerifying ? (
                                <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="text-center space-y-2">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-bold">Check your email</h3>
                                        <p className="text-sm text-gray-500">
                                            We sent a verification code to <strong>{verifyEmail}</strong>.
                                            <br />
                                            Click the link in the email <strong>OR</strong> enter the code below.
                                        </p>
                                    </div>

                                    <div className="flex justify-center">
                                        <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                            </InputOTPGroup>
                                            <div className="w-2" />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                                <InputOTPSlot index={6} />
                                                <InputOTPSlot index={7} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    <Button onClick={handleVerify} className="w-full bg-green-600 hover:bg-green-700 font-bold h-11" disabled={isPending || otpCode.length < 6}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Continue'}
                                    </Button>

                                    <div className="text-center space-y-2">
                                        <button
                                            onClick={handleResend}
                                            disabled={resendTimer > 0 || isPending}
                                            className="text-sm text-green-600 font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                                        >
                                            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
                                        </button>
                                        <div>
                                            <button onClick={() => setIsVerifying(false)} className="text-xs text-gray-400 hover:text-gray-900 underline">
                                                Wrong email? Go back
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Registration Form */
                                <>
                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                        <div onClick={() => setSelectedPlan('free')} className={`p-2 border rounded-lg cursor-pointer text-center transition-all ${selectedPlan === 'free' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="font-bold text-xs uppercase tracking-wider text-gray-500">Free</div>
                                            <div className="text-xl font-bold">$0</div>
                                        </div>
                                        <div onClick={() => setSelectedPlan('monthly')} className={`p-2 border rounded-lg cursor-pointer text-center transition-all ${selectedPlan === 'monthly' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="font-bold text-xs uppercase tracking-wider text-green-600">Monthly</div>
                                            <div className="text-xl font-bold">$4.99</div>
                                        </div>
                                        <div onClick={() => setSelectedPlan('yearly')} className={`p-2 border rounded-lg cursor-pointer text-center transition-all ${selectedPlan === 'yearly' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="font-bold text-xs uppercase tracking-wider text-green-600">Yearly</div>
                                            <div className="text-xl font-bold">$50</div>
                                        </div>
                                    </div>

                                    <form action={handleSignup} className="space-y-4">
                                        <input type="hidden" name="plan" value={selectedPlan} />
                                        <input type="hidden" name="country" value={selectedCountry} />

                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" name="username" placeholder="Investor123" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First name</Label>
                                                <Input id="firstName" name="firstName" placeholder="Omar" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last name</Label>
                                                <Input id="lastName" name="lastName" placeholder="Ali" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email Address</Label>
                                            <Input id="signup-email" name="email" type="email" required placeholder="n.salah@liverpool.com" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input id="signup-password" name="password" type="password" required minLength={6} placeholder="••••••••" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Country of Residence</Label>
                                            <Select onValueChange={setSelectedCountry} required>
                                                <SelectTrigger>
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
                                            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-start space-x-2">
                                                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(c as boolean)} />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        I agree to the <Link href="/terms" className="underline hover:text-green-600">Terms & Conditions</Link> and <Link href="/privacy" className="underline hover:text-green-600">Privacy Policy</Link>
                                                    </Label>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-2">
                                                <Checkbox id="marketing" name="marketing" />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground leading-snug">
                                                        I would like to receive updates about new Halal investment features and community news.
                                                    </Label>
                                                </div>
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold h-11" disabled={isPending}>
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {selectedPlan === 'free' ? 'Create Free Account' : 'Start 7-Day Free Trial'}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Right Side - Branding (Unchanged) */}
            <div className="hidden bg-gray-50 lg:block relative overflow-hidden">
                <div className="absolute inset-0 bg-green-900/5 z-10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center z-20">
                    <div className="max-w-xl mx-auto space-y-8">
                        <blockquote className="space-y-6">
                            <p className="text-4xl md:text-5xl font-serif text-gray-800 leading-tight tracking-tight">
                                &ldquo;{quote.text}&rdquo;
                            </p>
                            <footer className="text-xl text-green-700 font-medium italic">— {quote.source}</footer>
                        </blockquote>
                        <div className="flex justify-center gap-4 pt-8">
                            <div className="flex -space-x-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold">MR</div>
                                <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-700">AK</div>
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">FM</div>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                                Join 1000+ investors tracking Halal wealth
                            </div>
                        </div>
                    </div>
                </div>
                {/* Abstract Background Decoration */}
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20" />
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-20" />
            </div>
        </div>
    )
}
