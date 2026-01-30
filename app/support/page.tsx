import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Coffee, Star, Mail, Github, Twitter } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-bold">Support MyRizq</h1>
                    <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Help us maintain and grow this resource for the Muslim community. Your support enables us to keep MyRizq ad-free and constantly improving.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
                {/* Why Support */}
                <section>
                    <h2 className="text-2xl font-bold mb-6">Why Support Us?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card><CardContent className="pt-6 text-center"><Star className="w-8 h-8 text-primary mx-auto mb-2" /><h3 className="font-semibold">Accessible to All</h3><p className="text-sm text-muted-foreground">Your support helps us keep MyRizq accessible to everyone</p></CardContent></Card>
                        <Card><CardContent className="pt-6 text-center"><Heart className="w-8 h-8 text-accent mx-auto mb-2" /><h3 className="font-semibold">No Ads</h3><p className="text-sm text-muted-foreground">We refuse to show ads - your support funds our operations directly</p></CardContent></Card>
                        <Card><CardContent className="pt-6 text-center"><Coffee className="w-8 h-8 text-chart-4 mx-auto mb-2" /><h3 className="font-semibold">More Content</h3><p className="text-sm text-muted-foreground">Help us create more educational content and tools</p></CardContent></Card>
                    </div>
                </section>

                {/* How to Support */}
                <section>
                    <h2 className="text-2xl font-bold mb-6">Ways to Support</h2>
                    <div className="space-y-4">
                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg"><Coffee className="w-6 h-6 text-primary" /></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Buy Us a Coffee</h3>
                                    <p className="text-muted-foreground mb-4">A small one-time donation goes a long way in keeping us caffeinated and motivated!</p>
                                    <a href="https://buymeacoffee.com/myrizq3l" target="_blank" rel="noopener noreferrer">
                                        <Button className="gap-2"><Coffee className="w-4 h-4" />Support on Buy Me a Coffee</Button>
                                    </a>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-accent/10 rounded-lg"><Star className="w-6 h-6 text-accent" /></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Share MyRizq</h3>
                                    <p className="text-muted-foreground mb-4">Spread the word! Share MyRizq with friends, family, and your community.</p>
                                    <div className="flex gap-2">
                                        <a href="https://twitter.com/intent/tweet?text=Check%20out%20MyRizq%20-%20a%20free%20resource%20for%20Halal%20investing" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="gap-2"><Twitter className="w-4 h-4" />Share on Twitter</Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-chart-3/10 rounded-lg"><Mail className="w-6 h-6 text-chart-3" /></div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Feedback & Suggestions</h3>
                                    <p className="text-muted-foreground mb-4">Have ideas for improving MyRizq? We&apos;d love to hear from you!</p>
                                    <a href="mailto:contact@myrizq.com">
                                        <Button variant="outline" className="gap-2"><Mail className="w-4 h-4" />Email Us</Button>
                                    </a>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Thank You */}
                <section className="text-center py-8">
                    <p className="text-lg text-muted-foreground">
                        JazakAllah Khair for considering supporting MyRizq. <br />May Allah bless your rizq. 🌿
                    </p>
                    <Link href="/etfs"><Button className="mt-6">Explore Halal ETFs</Button></Link>
                </section>
            </main>
        </div>
    )
}
