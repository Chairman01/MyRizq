import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Twitter, MapPin } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="py-16 text-center bg-gray-50/50">
                <div className="max-w-3xl mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-muted-foreground text-lg">
                        We&apos;d love to hear from you. Here&apos;s how you can reach us.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        For general inquiries, support, or partnership opportunities.
                                    </p>
                                    <a href="mailto:myrizq3@gmail.com" className="text-primary font-medium hover:underline">
                                        myrizq3@gmail.com
                                    </a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Twitter className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Social Media</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Follow us for updates and community discussions.
                                    </p>
                                    <a href="https://twitter.com/myrizq" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium hover:underline">
                                        @MyRizq
                                    </a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <MapPin className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Location</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Based in Canada 🇨🇦<br /> Serving the Global Ummah
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Simple Message Form */}
                    <div className="bg-gray-50 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
                        <form className="space-y-4" action="mailto:myrizq3@gmail.com" method="GET">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Subject</label>
                                <input name="subject" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Inquiry about..." />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea name="body" className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="How can we help you?" />
                            </div>
                            <Button className="w-full">Open Email Client</Button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                This will open your default email app to send us a message.
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
