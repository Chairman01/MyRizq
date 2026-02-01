import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBlogPost, categoryLabels, type BlogPost } from "@/lib/blog-data"
import { createClient } from "@/utils/supabase/server"
import { ArrowLeft, Clock, User } from "lucide-react"

async function fetchDbPost(slug: string): Promise<BlogPost & { content?: string } | null> {
    const supabase = await createClient()
    const { data } = await supabase
        .from("blog_posts")
        .select("slug,title,excerpt,category,author,date,read_time,featured,content,image_url")
        .eq("slug", slug)
        .maybeSingle()
    if (!data) return null
    return {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        category: data.category,
        author: data.author,
        date: data.date,
        readTime: data.read_time,
        featured: data.featured,
        content: data.content || "",
        imageUrl: data.image_url || undefined
    }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const dbPost = await fetchDbPost(slug)
    const post = dbPost || getBlogPost(slug)

    if (!post) notFound()

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link href="/blog">
                    <Button variant="ghost" className="gap-2 mb-8"><ArrowLeft className="w-4 h-4" />Back to Learning Center</Button>
                </Link>

                <article className="space-y-8">
                    <header className="space-y-4">
                        <Badge>{categoryLabels[post.category]}</Badge>
                        <h1 className="text-4xl font-bold">{post.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1"><User className="w-4 h-4" />{post.author}</div>
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</div>
                            <span>{post.date}</span>
                        </div>
                    </header>
                    {post.imageUrl && (
                        <div className="w-full overflow-hidden rounded-xl border bg-muted/40">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
                        </div>
                    )}

                    <div className="prose prose-lg max-w-none">
                        <p className="lead text-xl text-muted-foreground">{post.excerpt}</p>
                        {dbPost?.content ? (
                            <div dangerouslySetInnerHTML={{ __html: dbPost.content }} />
                        ) : (
                            <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> This is a placeholder article. Full content for &quot;{post.title}&quot; is coming soon.
                                    Check back for detailed information about this topic.
                                </p>
                            </div>
                        )}
                    </div>
                </article>

                <div className="mt-12 pt-8 border-t">
                    <h3 className="text-lg font-semibold mb-4">Continue Learning</h3>
                    <Link href="/etfs"><Button className="gap-2">Explore Halal ETFs</Button></Link>
                </div>
            </main>
        </div>
    )
}
