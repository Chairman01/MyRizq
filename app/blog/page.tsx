import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { blogPosts, categoryLabels } from "@/lib/blog-data"
import { Clock, ArrowRight, BookOpen, Sparkles, PlayCircle, Youtube, ExternalLink } from "lucide-react"

// Real videos with actual YouTube IDs
const videos = [
    {
        id: "1",
        youtubeId: "tl6pGekDVsw",
        title: "What is Ethical Halal Investing? Let's Discuss this in detail",
        description: "Learn the basics of ethical Halal investing and why it matters for Muslim investors.",
        duration: "12:59",
        views: "256 views",
        date: "6 months ago",
    },
    {
        id: "2",
        youtubeId: "fp87tKGcdAc",
        title: "A Halal ETF has outpaced the stock market for multiple years. Here's SPUS...",
        description: "How SPUS has beaten the market while remaining Shariah-compliant.",
        duration: "10:35",
        views: "789 views",
        date: "8 months ago",
    },
    {
        id: "3",
        youtubeId: "Sx4LJFWhF9w",
        title: "7 Best Halal ETFs to invest for beginners in order",
        description: "A ranked list of the best Halal ETFs for those starting their investing journey.",
        duration: "17:05",
        views: "2K views",
        date: "9 months ago",
    },
    {
        id: "4",
        youtubeId: "XP7ce-4hXz0",
        title: "MyRizq Ultimate Halal ETF Tutorial",
        description: "Complete guide to using MyRizq for your Halal investment research.",
        duration: "8:27",
        views: "446 views",
        date: "10 months ago",
    },
]

export default function BlogPage() {
    const featuredPosts = blogPosts.filter(p => p.featured)
    const allPosts = blogPosts

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-white">
            <header className="py-16 text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 mb-6">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Learning Center</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Educational videos and articles about Halal investing, Islamic finance, and Shariah-compliant ETFs.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16">
                {/* Videos Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <PlayCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Video Guides</h2>
                        </div>
                        <a
                            href="https://www.youtube.com/@halalinvestor3725"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" className="gap-2 rounded-full border-red-200 text-red-600 hover:bg-red-50">
                                <Youtube className="w-4 h-4" />
                                Subscribe on YouTube
                                <ExternalLink className="w-3 h-3" />
                            </Button>
                        </a>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {videos.map((video) => (
                            <a
                                key={video.id}
                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Card className="h-full bg-white hover:shadow-xl transition-all duration-300 hover:border-red-200 hover:-translate-y-1 group cursor-pointer overflow-hidden">
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
                                            {video.duration}
                                        </Badge>
                                        <div className="absolute top-2 left-2">
                                            <Badge className="bg-red-600 text-white text-xs">
                                                <Youtube className="w-3 h-3 mr-1" /> Video
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors mb-2 line-clamp-2 text-sm">
                                            {video.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{video.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{video.views}</span>
                                            <span>•</span>
                                            <span>{video.date}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        ))}
                    </div>

                    {/* YouTube Channel Banner */}
                    <div className="mt-8 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Youtube className="w-12 h-12" />
                            <div>
                                <h3 className="text-xl font-bold">Halal Investor YouTube Channel</h3>
                                <p className="text-red-100">Watch more videos on Halal investing and Islamic finance</p>
                            </div>
                        </div>
                        <a
                            href="https://www.youtube.com/@halalinvestor3725"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="bg-white text-red-600 hover:bg-red-50 gap-2 rounded-full px-6 transition-all duration-300 hover:scale-105">
                                Visit Channel <ExternalLink className="w-4 h-4" />
                            </Button>
                        </a>
                    </div>
                </section>

                {/* Featured Articles */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {featuredPosts.map((post) => (
                            <Link key={post.slug} href={`/blog/${post.slug}`}>
                                <Card className="h-full bg-white hover:shadow-xl transition-all duration-300 hover:border-green-200 hover:-translate-y-1 group cursor-pointer">
                                    <CardContent className="p-6 space-y-4">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">{categoryLabels[post.category]}</Badge>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">{post.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</div>
                                            <div className="flex items-center gap-1 text-green-600 font-medium group-hover:translate-x-1 transition-transform">
                                                Read <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* All Articles */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">All Articles</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allPosts.map((post) => (
                            <Link key={post.slug} href={`/blog/${post.slug}`}>
                                <Card className="h-full bg-white hover:shadow-lg transition-all duration-300 hover:border-green-200 hover:-translate-y-1 group cursor-pointer">
                                    <CardContent className="p-6 space-y-3">
                                        <Badge variant="outline" className="text-xs">{categoryLabels[post.category]}</Badge>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{post.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />{post.readTime}
                                            <span>·</span>
                                            <span>{post.date}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
