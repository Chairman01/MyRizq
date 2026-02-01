"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const CATEGORY_OPTIONS = [
  "getting-started",
  "etf-analysis",
  "islamic-finance",
  "guides"
]

type EditorProps = {
  initialData?: {
    id?: string
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
}

export default function ArticleEditor({ initialData }: EditorProps) {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    category: initialData?.category || "getting-started",
    author: initialData?.author || "MyRizq Team",
    date: initialData?.date || "",
    read_time: initialData?.read_time || "5 min",
    featured: initialData?.featured || false,
    content: initialData?.content || "",
    image_url: initialData?.image_url || ""
  })

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = form.content || ""
    }
  }, [])

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    setForm((prev) => ({ ...prev, content: editorRef.current?.innerHTML || "" }))
  }

  const insertImage = (url: string) => {
    if (!url) return
    editorRef.current?.focus()
    document.execCommand("insertImage", false, url)
    setForm((prev) => ({ ...prev, content: editorRef.current?.innerHTML || "" }))
  }

  const uploadImage = async (file: File) => {
    if (!file) return
    setSaving(true)
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const body = new FormData()
    body.append("file", file)
    const res = await fetch("/api/admin/blog-images", { method: "POST", body })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      setError(data.error || "Image upload failed")
    } else {
      setForm((prev) => ({ ...prev, image_url: data.url }))
      setImagePreview(data.url)
      insertImage(data.url)
      setError(null)
    }
    setSaving(false)
  }

  const handleSave = async () => {
    if (!form.slug || !form.title || !form.excerpt || !form.date) return
    setSaving(true)
    const payload = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      category: form.category,
      author: form.author,
      date: form.date,
      read_time: form.read_time,
      featured: form.featured,
      content: form.content,
      image_url: form.image_url || null
    }
    if (initialData?.id) {
      const res = await fetch(`/api/admin/blog-posts/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError(data.error || "Save failed")
      } else {
        setError(null)
      }
    } else {
      const res = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        setError(data.error || "Save failed")
      } else if (data?.post?.id) {
        router.replace(`/admin/articles/${data.post.id}`)
        setError(null)
      }
    }
    setSaving(false)
  }

  const headerLabel = useMemo(() => (initialData?.id ? "Edit Article" : "Create New Article"), [initialData?.id])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{headerLabel}</h1>
          <p className="text-sm text-muted-foreground">Write, format, and publish your article.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/articles")}>Back to Articles</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Article"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Slug (e.g., what-is-halal-etf)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <Input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Input placeholder="Date (YYYY-MM-DD)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Read time (e.g., 8 min)" value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Featured image</label>
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <Input
                placeholder="Image URL (optional)"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(file)
                }}
              />
            </div>
            {imagePreview && (
              <div className="w-full max-w-md overflow-hidden rounded-lg border">
                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map(option => (
              <Button
                key={option}
                type="button"
                variant={form.category === option ? "default" : "outline"}
                size="sm"
                onClick={() => setForm({ ...form, category: option })}
              >
                {option}
              </Button>
            ))}
            <Button
              type="button"
              variant={form.featured ? "default" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, featured: !form.featured })}
            >
              {form.featured ? "Featured" : "Not featured"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => exec("bold")}>Bold</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("italic")}>Italic</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("underline")}>Underline</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("formatBlock", "H2")}>H2</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("formatBlock", "H3")}>H3</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("insertUnorderedList")}>Bullet</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("insertOrderedList")}>Numbered</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => exec("removeFormat")}>Clear</Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const url = prompt("Image URL")
                if (url) insertImage(url)
              }}
            >
              Insert Image
            </Button>
          </div>
          <div
            ref={editorRef}
            className="min-h-[260px] rounded-md border p-4 focus:outline-none"
            contentEditable
            onInput={() => setForm((prev) => ({ ...prev, content: editorRef.current?.innerHTML || "" }))}
          />
          <Textarea
            className="min-h-[120px]"
            placeholder="(Optional) Raw HTML preview"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div className="text-xs text-muted-foreground">
            Tip: You can paste images and format text using the toolbar above.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
