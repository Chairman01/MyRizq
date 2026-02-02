"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from "sonner"
import { usePaywall } from './use-paywall'

export interface PortfolioItem {
    ticker: string
    name: string
    type: 'ETF' | 'Stock' | 'Cash' | 'Crypto'
    allocation: number // For Simulator
    shares?: number    // For Tracker
    avgPrice?: number  // For Tracker
    sector?: string
    expenseRatio?: number
    currency?: string
    amount?: number
    // Crypto-specific fields
    cryptoId?: string  // CoinGecko ID for price fetching
    // Could add 'shares' and 'avgPrice' later for real tracking
}

export interface Portfolio {
    id: string
    name: string
    type: 'simulator' | 'tracker' // Distinguish between % based and Share based
    items: PortfolioItem[]
    ownerId?: string
}

interface PortfolioState {
    portfolios: Record<string, Portfolio>
    currentPortfolioId: string
    userId: string | null

    // Actions
    setUserId: (id: string | null) => void
    createPortfolio: (name: string, type?: 'simulator' | 'tracker') => void
    deletePortfolio: (id: string) => void
    selectPortfolio: (id: string) => void
    reset: () => void

    // Item Actions
    addToPortfolio: (ticker: string, name: string, type?: 'ETF' | 'Stock', extras?: { sector?: string, expenseRatio?: number, shares?: number, avgPrice?: number }, portfolioId?: string) => void
    addCash: (currency: string, amount: number, portfolioId?: string) => void
    addCrypto: (symbol: string, name: string, cryptoId: string, amount: number, avgPrice: number, portfolioId?: string) => void
    removeFromPortfolio: (ticker: string) => void
    updateAllocation: (ticker: string, allocation: number) => void
    updateHolding: (ticker: string, shares: number, avgPrice: number) => void
    updateCash: (ticker: string, amount: number) => void

    // Getters
    getCurrentPortfolio: () => Portfolio | undefined
    getAllPortfolios: () => Portfolio[]
    getAggregatedPortfolio: () => Portfolio
}

const DEFAULT_ID = 'default'

// ... imports
import { createClient } from '@/utils/supabase/client'

// ... interfaces

export const usePortfolio = create<PortfolioState>()(
    persist(
        (set, get) => ({
            portfolios: {
                [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Guest Portfolio', type: 'tracker', items: [] }
            },
            currentPortfolioId: 'all',
            userId: null,

            setUserId: async (id) => {
                // Security: Clear any portfolios that don't belong to the new user
                // This prevents data leakage from previous sessions (e.g. if local storage persisted another user's data)
                set(state => {
                    const cleanPortfolios = { ...state.portfolios }
                    Object.keys(cleanPortfolios).forEach(key => {
                        const p = cleanPortfolios[key]
                        // Remove if it has an owner and that owner is NOT the new user
                        if (p.ownerId && p.ownerId !== id) {
                            delete cleanPortfolios[key]
                        }
                    })
                    return { userId: id, portfolios: cleanPortfolios }
                })

                if (id) {
                    // Sync from DB
                    const supabase = createClient()
                    const { data, error } = await supabase.from('portfolios').select('*').eq('user_id', id)

                    if (!error && data) {
                        set(state => {
                            const newPortfolios = { ...state.portfolios }
                            data.forEach((p: any) => {
                                newPortfolios[p.id] = {
                                    id: p.id,
                                    name: p.name,
                                    type: p.type,
                                    items: p.items || [],
                                    ownerId: p.user_id
                                }
                            })
                            return { portfolios: newPortfolios }
                        })
                    }
                }
            },

            reset: () => set({
                portfolios: {
                    [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Guest Portfolio', type: 'tracker', items: [] }
                },
                currentPortfolioId: DEFAULT_ID,
                userId: null
            }),

            getCurrentPortfolio: () => {
                const { portfolios, currentPortfolioId, userId } = get()
                const portfolio = portfolios[currentPortfolioId]
                if (portfolio) {
                    if (userId) {
                        if (portfolio.ownerId === userId) return portfolio
                        const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                        if (userPortfolios.length > 0) return userPortfolios[0]
                        return undefined
                    }
                    if (!portfolio.ownerId) return portfolio
                }
                const all = Object.values(portfolios)
                if (userId) return all.find(p => p.ownerId === userId)
                return all.find(p => !p.ownerId)
            },

            getAllPortfolios: () => {
                const { portfolios, userId } = get()
                const all = Object.values(portfolios)
                if (userId) return all.filter(p => p.ownerId === userId)
                return all.filter(p => !p.ownerId)
            },

            getAggregatedPortfolio: () => {
                const { portfolios, userId } = get()
                const all = Object.values(portfolios).filter(p => userId ? p.ownerId === userId : !p.ownerId)

                // Merge items
                const mergedItems: PortfolioItem[] = []
                all.forEach(p => mergedItems.push(...p.items))

                return {
                    id: 'all',
                    name: 'All Portfolios',
                    type: 'tracker',
                    items: mergedItems,
                    ownerId: userId || undefined
                } as Portfolio
            },

            createPortfolio: async (name, type = 'tracker') => {
                const { userId } = get()
                const id = userId ? crypto.randomUUID() : (name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now())

                const newPortfolio: Portfolio = { id, name, type, items: [], ownerId: userId || undefined }

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [id]: newPortfolio
                    },
                    currentPortfolioId: id
                }))
                toast.success(`Created "${name}"`)

                if (userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').insert({
                        id,
                        user_id: userId,
                        name,
                        type,
                        items: []
                    })
                }
            },

            deletePortfolio: async (id) => {
                const { userId } = get()
                if (!userId && id === DEFAULT_ID) {
                    toast.error("Cannot delete default portfolio")
                    return
                }

                set(state => {
                    const portfolio = state.portfolios[id]
                    if (userId && portfolio.ownerId !== userId) return state

                    const { [id]: deleted, ...rest } = state.portfolios
                    const remaining = Object.values(rest).filter(p => userId ? p.ownerId === userId : !p.ownerId)
                    const newId = remaining.length > 0 ? remaining[0].id : (userId ? '' : DEFAULT_ID)

                    return { portfolios: rest, currentPortfolioId: newId }
                })
                toast.success("Portfolio deleted")

                if (userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').delete().eq('id', id)
                }
            },

            selectPortfolio: (id) => set({ currentPortfolioId: id }),

            addToPortfolio: async (ticker, name, type = 'Stock', extras, portfolioId) => {
                const { portfolios, currentPortfolioId, userId, createPortfolio } = get()
                let targetId = portfolioId || currentPortfolioId

                if (!portfolios[targetId] || (userId && portfolios[targetId].ownerId !== userId)) {
                    const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                    if (userPortfolios.length > 0) {
                        targetId = userPortfolios[0].id
                        set({ currentPortfolioId: targetId })
                    } else {
                        // Create default if none exists
                        // Note: We can't await createPortfolio here easily because of state updates, 
                        // so we duplicate logic or assume user handles creation. 
                        // For MVP auto-create:
                        const newId = userId ? crypto.randomUUID() : ('my-portfolio-' + Date.now())
                        const newP: Portfolio = { id: newId, name: 'My Portfolio', type: 'tracker', items: [], ownerId: userId || undefined }
                        set(state => ({ portfolios: { ...state.portfolios, [newId]: newP }, currentPortfolioId: newId }))
                        targetId = newId

                        if (userId) {
                            const supabase = createClient()
                            await supabase.from('portfolios').insert({ id: newId, user_id: userId, name: 'My Portfolio', type: 'tracker', items: [] })
                        }
                    }
                }

                const current = get().portfolios[targetId]
                // PAYWALL CHECK
                const { isPremium, setPaywallOpen } = usePaywall.getState()
                if (!isPremium && current.items.length >= 5) {
                    setPaywallOpen(true)
                    return
                }

                if (current.items.some(p => p.ticker === ticker)) {
                    toast.info(`${ticker} is already in ${current.name}`)
                    return
                }

                const newItem: PortfolioItem = {
                    ticker, name, type,
                    allocation: 0,
                    shares: extras?.shares || 0,
                    avgPrice: extras?.avgPrice || 0,
                    expenseRatio: extras?.expenseRatio || 0,
                    sector: extras?.sector
                }

                if (current.type === 'simulator') {
                    const currentAlloc = current.items.reduce((sum, p) => sum + p.allocation, 0)
                    const remainingAlloc = Math.max(0, 100 - currentAlloc)
                    newItem.allocation = remainingAlloc > 0 ? 5 : 0
                }

                const updatedPortfolio = { ...current, items: [...current.items, newItem] }

                set(state => ({
                    portfolios: { ...state.portfolios, [targetId]: updatedPortfolio }
                }))
                toast.success(`Added ${ticker}`)

                if (userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedPortfolio.items, updated_at: new Date() }).eq('id', targetId)
                }
            },

            addCash: async (currency, amount, portfolioId) => {
                const targetCurrency = currency.toUpperCase()
                if (!targetCurrency || targetCurrency.length < 3 || !amount || amount <= 0) return

                const { portfolios, currentPortfolioId, userId } = get()
                let targetId = portfolioId || currentPortfolioId

                if (!portfolios[targetId] || (userId && portfolios[targetId].ownerId !== userId)) {
                    const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                    if (userPortfolios.length > 0) {
                        targetId = userPortfolios[0].id
                        set({ currentPortfolioId: targetId })
                    } else {
                        return
                    }
                }

                const current = get().portfolios[targetId]
                const cashTicker = `CASH-${targetCurrency}`
                const existingIndex = current.items.findIndex(p => p.ticker === cashTicker && p.type === 'Cash')

                let updatedItems: PortfolioItem[]
                if (existingIndex >= 0) {
                    updatedItems = current.items.map((item, idx) => {
                        if (idx !== existingIndex) return item
                        const currentAmount = item.amount || 0
                        return { ...item, amount: currentAmount + amount }
                    })
                } else {
                    const newItem: PortfolioItem = {
                        ticker: cashTicker,
                        name: `Cash (${targetCurrency})`,
                        type: 'Cash',
                        allocation: 0,
                        amount,
                        currency: targetCurrency
                    }
                    updatedItems = [...current.items, newItem]
                }

                const updatedPortfolio = { ...current, items: updatedItems }

                set(state => ({
                    portfolios: { ...state.portfolios, [targetId]: updatedPortfolio }
                }))
                toast.success(`Added Cash (${targetCurrency})`)

                if (userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedPortfolio.items, updated_at: new Date() }).eq('id', targetId)
                }
            },

            addCrypto: async (symbol, name, cryptoId, amount, avgPrice, portfolioId) => {
                if (!symbol || !name || amount <= 0) return

                const { portfolios, currentPortfolioId, userId } = get()
                let targetId = portfolioId || currentPortfolioId

                if (!portfolios[targetId] || (userId && portfolios[targetId].ownerId !== userId)) {
                    const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                    if (userPortfolios.length > 0) {
                        targetId = userPortfolios[0].id
                        set({ currentPortfolioId: targetId })
                    } else {
                        return
                    }
                }

                const current = get().portfolios[targetId]
                const cryptoTicker = symbol.toUpperCase()
                const existingIndex = current.items.findIndex(p => p.ticker === cryptoTicker && p.type === 'Crypto')

                let updatedItems: PortfolioItem[]
                if (existingIndex >= 0) {
                    // Update existing crypto holding
                    updatedItems = current.items.map((item, idx) => {
                        if (idx !== existingIndex) return item
                        const currentAmount = item.shares || 0
                        const currentAvg = item.avgPrice || 0
                        const totalCost = (currentAmount * currentAvg) + (amount * avgPrice)
                        const totalAmount = currentAmount + amount
                        const newAvgPrice = totalAmount > 0 ? totalCost / totalAmount : avgPrice
                        return { ...item, shares: totalAmount, avgPrice: newAvgPrice }
                    })
                } else {
                    const newItem: PortfolioItem = {
                        ticker: cryptoTicker,
                        name: name,
                        type: 'Crypto',
                        allocation: 0,
                        shares: amount,
                        avgPrice: avgPrice,
                        cryptoId: cryptoId
                    }
                    updatedItems = [...current.items, newItem]
                }

                const updatedPortfolio = { ...current, items: updatedItems }

                set(state => ({
                    portfolios: { ...state.portfolios, [targetId]: updatedPortfolio }
                }))
                toast.success(`Added ${cryptoTicker}`)

                if (userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedPortfolio.items, updated_at: new Date() }).eq('id', targetId)
                }
            },

            removeFromPortfolio: async (ticker) => {
                const { currentPortfolioId, userId, portfolios } = get()
                if (!currentPortfolioId) return

                const current = portfolios[currentPortfolioId]
                const updatedItems = current.items.filter(p => p.ticker !== ticker)

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: { ...current, items: updatedItems }
                    }
                }))
                toast.success(`Removed ${ticker}`)

                if (userId && current.ownerId === userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedItems, updated_at: new Date() }).eq('id', currentPortfolioId)
                }
            },

            updateAllocation: async (ticker, allocation) => {
                const { currentPortfolioId, userId, portfolios } = get()
                if (!currentPortfolioId) return

                const current = portfolios[currentPortfolioId]
                const updatedItems = current.items.map(p => p.ticker === ticker ? { ...p, allocation: Math.max(0, Math.min(100, allocation)) } : p)

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: { ...current, items: updatedItems }
                    }
                }))

                if (userId && current.ownerId === userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedItems, updated_at: new Date() }).eq('id', currentPortfolioId)
                }
            },

            updateHolding: async (ticker, shares, avgPrice) => {
                const { currentPortfolioId, userId, portfolios } = get()
                if (!currentPortfolioId) return

                const current = portfolios[currentPortfolioId]
                const updatedItems = current.items.map(p => p.ticker === ticker ? { ...p, shares, avgPrice } : p)

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: { ...current, items: updatedItems }
                    }
                }))

                if (userId && current.ownerId === userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedItems, updated_at: new Date() }).eq('id', currentPortfolioId)
                }
            },

            updateCash: async (ticker, amount) => {
                const { currentPortfolioId, userId, portfolios } = get()
                if (!currentPortfolioId) return

                const current = portfolios[currentPortfolioId]
                const updatedItems = current.items.map(p => p.ticker === ticker ? { ...p, amount: Math.max(0, amount) } : p)

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: { ...current, items: updatedItems }
                    }
                }))

                if (userId && current.ownerId === userId) {
                    const supabase = createClient()
                    await supabase.from('portfolios').update({ items: updatedItems, updated_at: new Date() }).eq('id', currentPortfolioId)
                }
            }
        }),
        {
            name: 'myrizq-portfolio-storage-v3',
            partialize: (state) => {
                if (!state.userId) {
                    // If no user, do not persist anything (return empty)
                    // Or return initial state if needed, but returning empty object is safer for hydration
                    return {} as any
                    // Actually, if we return empty, hydration will overwrite default state with empty? 
                    // No, persist usually merges. 
                    // Stronger approach: strict omit.
                }
                return state
            },
            onRehydrateStorage: () => (state) => {
                // Optional: Check if rehydrated state has no user, ensure clean slate?
            }
        }
    )
)
