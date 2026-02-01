"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { blogPosts } from "@/lib/blog-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type BlogRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  read_time: string
  featured: boolean
  content: string
  image_url?: string | null
}

type SitePost = {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  read_time: string
  featured: boolean
  image_url?: string | null
}

const CATEGORY_OPTIONS = [
  "getting-started",
  "etf-analysis",
  "islamic-finance",
  "guides"
]

export default function AdminArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<BlogRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importingSlug, setImportingSlug] = useState<string | null>(null)
  const [sitePosts, setSitePosts] = useState<SitePost[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/admin/blog-posts")
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || "Failed to load articles")
      setArticles((data.posts as BlogRow[]) || [])
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setSitePosts(
      blogPosts.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        author: post.author,
        date: post.date,
        read_time: post.readTime,
        featured: Boolean(post.featured),
        image_url: post.imageUrl || null
      }))
    )
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const featuredCount = useMemo(() => articles.filter(a => a.featured).length, [articles])
  const filteredArticles = useMemo(() => {
    if (!query) return articles
    const needle = query.toLowerCase()
    return articles.filter((row) =>
      row.title.toLowerCase().includes(needle) ||
      row.slug.toLowerCase().includes(needle) ||
      row.category.toLowerCase().includes(needle)
    )
  }, [articles, query])

  const filteredSitePosts = useMemo(() => {
    if (!query) return sitePosts
    const needle = query.toLowerCase()
    return sitePosts.filter((row) =>
      row.title.toLowerCase().includes(needle) ||
      row.slug.toLowerCase().includes(needle) ||
      row.category.toLowerCase().includes(needle)
    )
  }, [sitePosts, query])

  const importDefaults = async () => {
    setImporting(true)
    const payload = blogPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      date: post.date,
      read_time: post.readTime,
      featured: Boolean(post.featured),
      content: "",
      image_url: post.imageUrl || null
    }))
    try {
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || "Failed to import")
      await fetchArticles()
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setImporting(false)
  }

  const importSingle = async (post: SitePost) => {
    setImporting(true)
    setImportingSlug(post.slug)
    try {
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            category: post.category,
            author: post.author,
            date: post.date,
            read_time: post.read_time,
            featured: post.featured,
            content: "",
            image_url: post.image_url || null
          }
        ])
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || "Failed to import")
      await fetchArticles()
      const inserted = (data.posts || []).find((row: BlogRow) => row.slug === post.slug)
      if (inserted?.id) router.push(`/admin/articles/${inserted.id}`)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setImporting(false)
    setImportingSlug(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and manage articles.</p>
        </div>
        <Link href="/admin/articles/new">
          <Button>New Article</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total articles</p>
            <p className="text-2xl font-bold">{articles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Featured</p>
            <p className="text-2xl font-bold">{featuredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Latest</p>
            <p className="text-sm font-medium">{articles[0]?.title || "No articles yet"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All articles ({filteredArticles.length || filteredSitePosts.length})</CardTitle>
          <p className="text-xs text-muted-foreground">Featured: {featuredCount}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="outline" onClick={importDefaults} disabled={importing}>
              {importing ? "Importing..." : "Import site articles"}
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.6fr_0.4fr_0.5fr_0.8fr] gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground bg-muted/40">
              <div>Title</div>
              <div>Category</div>
              <div>Date</div>
              <div>Featured</div>
              <div>Actions</div>
            </div>
            {(filteredArticles.length > 0 ? filteredArticles : filteredSitePosts).map((row: any) => (
              <div
                key={row.id || row.slug}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_0.6fr_0.4fr_0.5fr_0.8fr] gap-3 px-4 py-3 border-t items-center cursor-pointer hover:bg-muted/30"
                onClick={() => {
                  if ("id" in row) {
                    router.push(`/admin/articles/${row.id}`)
                  } else {
                    importSingle(row)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {row.image_url && (
                    <img src={row.image_url} alt={row.title} className="w-16 h-10 object-cover rounded border" />
                  )}
                  <div>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{row.slug}</div>
                  </div>
                </div>
                <div className="text-sm">{row.category}</div>
                <div className="text-sm">{row.date}</div>
                <div>{row.featured ? <Badge>Featured</Badge> : <Badge variant="outline">No</Badge>}</div>
                <div className="flex flex-wrap gap-2">
                  {"id" in row ? (
                    <>
                      <Link
                        href={`/admin/articles/${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        importSingle(row)
                      }}
                      disabled={importing}
                    >
                      {importingSlug === row.slug ? "Importing..." : "Import & Edit"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredArticles.length === 0 && filteredSitePosts.length === 0 && (
            <div className="text-sm text-muted-foreground">No articles yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
