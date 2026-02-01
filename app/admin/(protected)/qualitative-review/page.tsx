"use client"

import { useEffect, useMemo, useState } from "react"
import { stockDatabase } from "@/lib/stock-data"
import { LOCKED_TICKERS } from "@/lib/sec/locked-tickers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type OverrideRow = {
  ticker: string
  locked: boolean
  updated_at?: string
}

export default function QualitativeReviewPage() {
  const [overrides, setOverrides] = useState<OverrideRow[]>([])
  const [loading, setLoading] = useState(false)
  const [lockTicker, setLockTicker] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const fetchOverrides = async () => {
    try {
      const res = await fetch("/api/qualitative-overrides")
      if (res.ok) {
        const data = await res.json()
        setOverrides(data.overrides || [])
      }
    } catch {
      setOverrides([])
    }
  }

  useEffect(() => {
    fetchOverrides()
  }, [])

  const lockedSet = useMemo(() => {
    const set = new Set<string>()
    for (const entry of LOCKED_TICKERS) set.add(entry.ticker)
    for (const row of overrides) if (row.locked) set.add(row.ticker.toUpperCase())
    return set
  }, [overrides])

  const allTickers = useMemo(() => Object.keys(stockDatabase).sort(), [])
  const lockedTickers = allTickers.filter(t => lockedSet.has(t))
  const pendingTickers = allTickers.filter(t => !lockedSet.has(t))

  const filteredLocked = useMemo(() => {
    if (!query) return lockedTickers
    const needle = query.toLowerCase()
    return lockedTickers.filter(t => t.toLowerCase().includes(needle))
  }, [lockedTickers, query])

  const filteredPending = useMemo(() => {
    if (!query) return pendingTickers
    const needle = query.toLowerCase()
    return pendingTickers.filter(t => t.toLowerCase().includes(needle))
  }, [pendingTickers, query])

  const lockCurrent = async () => {
    if (!lockTicker) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/screen-stock?ticker=${encodeURIComponent(lockTicker)}`)
      if (!res.ok) throw new Error("Failed to fetch screening data")
      const data = await res.json()
      const segments = data?.qualitative?.segmentBreakdown || []
      if (!Array.isArray(segments) || segments.length === 0) {
        throw new Error("No segments available to lock")
      }
      const totalRevenue = data?.qualitative?.segmentTotal || null
      const year = data?.secFiling?.filedAt ? Number(String(data.secFiling.filedAt).slice(0, 4)) : null
      const post = await fetch("/api/qualitative-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: lockTicker,
          segments: segments.map((seg: any) => ({
            name: seg.name,
            value: seg.value
          })),
          total_revenue: totalRevenue,
          year,
          source: "Manual review",
          notes: "Locked from current screen result"
        })
      })
      if (!post.ok) {
        const err = await post.json()
        throw new Error(err.error || "Failed to store override")
      }
      setMessage(`Locked ${lockTicker.toUpperCase()}`)
      setLockTicker("")
      await fetchOverrides()
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qualitative Review</h1>
        <p className="text-sm text-muted-foreground">
          Locked tickers skip LLM and are treated as correct.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Locked</p>
            <p className="text-2xl font-bold">{lockedTickers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Needs review</p>
            <p className="text-2xl font-bold">{pendingTickers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total tickers</p>
            <p className="text-2xl font-bold">{allTickers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lock current segments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Ticker (e.g., ABBV)"
              value={lockTicker}
              onChange={(e) => setLockTicker(e.target.value.toUpperCase())}
            />
            <Button onClick={lockCurrent} disabled={loading}>
              {loading ? "Locking..." : "Lock from current result"}
            </Button>
          </div>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search tickers</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by ticker (e.g., NVDA)"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Locked ({filteredLocked.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {filteredLocked.map(t => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs review ({filteredPending.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {filteredPending.map(t => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
