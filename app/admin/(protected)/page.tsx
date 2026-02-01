"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LOCKED_TICKERS } from "@/lib/sec/locked-tickers"

type BlogRow = { featured: boolean }
type OverrideRow = { ticker: string; locked: boolean }

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [articles, setArticles] = useState<BlogRow[]>([])
  const [overrides, setOverrides] = useState<OverrideRow[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: blogRows } = await supabase
        .from("blog_posts")
        .select("featured")
      setArticles((blogRows as BlogRow[]) || [])

      const res = await fetch("/api/qualitative-overrides")
      if (res.ok) {
        const data = await res.json()
        setOverrides(data.overrides || [])
      }
    }
    run()
  }, [])

  const featuredCount = useMemo(() => articles.filter(a => a.featured).length, [articles])
  const lockedCount = useMemo(() => {
    const set = new Set<string>()
    for (const entry of LOCKED_TICKERS) set.add(entry.ticker)
    for (const row of overrides) if (row.locked) set.add(row.ticker.toUpperCase())
    return set.size
  }, [overrides])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage articles and qualitative reviews.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/blog"><Button variant="outline">View Site</Button></Link>
          <Link href="/admin/articles"><Button>Manage Articles</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Articles</p>
            <p className="text-2xl font-bold">{articles.length}</p>
            <Badge variant="outline" className="mt-2">Featured: {featuredCount}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Locked tickers</p>
            <p className="text-2xl font-bold">{lockedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Needs review</p>
            <p className="text-2xl font-bold">Visit review page</p>
            <Link href="/admin/qualitative-review">
              <Button variant="outline" size="sm" className="mt-2">Open review</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Create, edit, feature, and upload images for articles.</p>
            <div className="flex gap-2">
              <Link href="/admin/articles"><Button>Manage Articles</Button></Link>
              <Link href="/admin/articles"><Button variant="outline">New Article</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualitative Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Review and lock qualitative segment data.</p>
            <Link href="/admin/qualitative-review"><Button>Open Review</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
