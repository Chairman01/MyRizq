"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquarePlus, Send, Lightbulb, CheckCircle2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const existingIdeas = [
    "Portfolio performance tracking over time",
    "Email alerts for ETF news",
    "Mobile app version",
    "Dividend tracking and history",
    "Integration with brokerage accounts",
]

export default function FeedbackPage() {
    const [submitted, setSubmitted] = useState(false)
    const [email, setEmail] = useState("")
    const [feature, setFeature] = useState("")
    const [details, setDetails] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feature.trim()) return
        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const response = await fetch("/api/feedback/feature-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim() || null,
                    title: feature.trim(),
                    details: details.trim() || null,
                    userId: user?.id || null
                })
            })
            if (response.ok) {
                setSubmitted(true)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white">
            <header className="py-12 text-center bg-gray-50/50 border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-6">
                        <MessageSquarePlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Feedback & Bug Reports</h1>
                    <p className="text-gray-600 text-lg">
                        Help us improve. Request features or report any issues you encounter.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pb-20">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Submit Form */}
                    <Card className="bg-white shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-green-600" />
                                Submit an Idea
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {submitted ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                                    <p className="text-gray-600">Your feature request has been submitted. We review all ideas!</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => { setSubmitted(false); setFeature(""); setDetails(""); }}
                                    >
                                        Submit Another
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="rounded-lg"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Get notified when your feature is shipped</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Feature Title *</label>
                                        <Input
                                            type="text"
                                            placeholder="e.g., Stock screener for individual halal stocks"
                                            value={feature}
                                            onChange={(e) => setFeature(e.target.value)}
                                            required
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                                        <Textarea
                                            placeholder="Describe your idea in more detail. What problem does it solve?"
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                            rows={4}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full rounded-lg bg-green-600 hover:bg-green-700 gap-2" disabled={submitting}>
                                        <Send className="w-4 h-4" /> Submit Feature Request
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Popular Ideas */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Feature Ideas</h2>
                        <div className="space-y-3">
                            {existingIdeas.map((idea, i) => (
                                <Card key={i} className="bg-white border border-gray-100 hover:border-green-200 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{idea}</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full text-green-600 border-green-200 hover:bg-green-50">
                                            👍 Vote
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Want to see these features? Vote to help us prioritize!
                        </p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12 text-center p-8 bg-gray-50 rounded-2xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Have questions or need help?</h3>
                    <p className="text-gray-600 mb-4">
                        Reach out to us directly at{' '}
                        <a href="mailto:myrizq3@gmail.com" className="text-green-600 font-medium hover:underline">
                            myrizq3@gmail.com
                        </a>
                    </p>
                </div>
            </main>
        </div>
    )
}
