"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ArticleEditor from "@/components/admin/article-editor"

export default function EditArticlePage() {
  const params = useParams()
  const id = String(params?.id || "")
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/admin/blog-posts/${id}`)
      const result = await res.json()
      if (res.ok) setData(result.post)
    }
    if (id) run()
  }, [id])

  if (!data) return null

  return (
    <ArticleEditor
      initialData={{
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        category: data.category,
        author: data.author,
        date: data.date,
        read_time: data.read_time,
        featured: data.featured,
        content: data.content || "",
        image_url: data.image_url || ""
      }}
    />
  )
}
