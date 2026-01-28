"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from "sonner"
import { usePaywall } from './use-paywall'

export interface PortfolioItem {
    ticker: string
    name: string
    type: 'ETF' | 'Stock'
    allocation: number // For Simulator
    shares?: number    // For Tracker
    avgPrice?: number  // For Tracker
    sector?: string
    expenseRatio?: number
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
    addToPortfolio: (ticker: string, name: string, type?: 'ETF' | 'Stock', extras?: { sector?: string, expenseRatio?: number, shares?: number, avgPrice?: number }) => void
    removeFromPortfolio: (ticker: string) => void
    updateAllocation: (ticker: string, allocation: number) => void
    updateHolding: (ticker: string, shares: number, avgPrice: number) => void

    // Getters
    getCurrentPortfolio: () => Portfolio | undefined
    getAllPortfolios: () => Portfolio[]
}

const DEFAULT_ID = 'default'

export const usePortfolio = create<PortfolioState>()(
    persist(
        (set, get) => ({
            portfolios: {
                [DEFAULT_ID]: { id: DEFAULT_ID, name: 'Guest Portfolio', type: 'tracker', items: [] }
            },
            currentPortfolioId: DEFAULT_ID,
            userId: null,

            setUserId: (id) => set({ userId: id }),

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

                // If portfolio exists and matches user (or is generic guest one if no user), return it
                if (portfolio) {
                    // If logged in, only return if owner matches OR if it's the specific guest fallback (handled in UI)
                    if (userId) {
                        // Strict check: User can only see their own portfolios
                        if (portfolio.ownerId === userId) return portfolio

                        // If selected portfolio is not theirs, try to find one that is
                        const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                        if (userPortfolios.length > 0) return userPortfolios[0]

                        // If they have no portfolios yet, return undefined (UI should prompt create)
                        return undefined
                    }
                    // If guest, only return if NO ownerId
                    if (!portfolio.ownerId) return portfolio
                }

                // Fallback: Return first matching portfolio
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

            createPortfolio: (name, type = 'tracker') => {
                const { userId } = get()
                const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [id]: { id, name, type, items: [], ownerId: userId || undefined }
                    },
                    currentPortfolioId: id
                }))
                toast.success(`Created "${name}"`)
            },

            deletePortfolio: (id) => {
                const { userId } = get()
                // Prevent deleting default if guest
                if (!userId && id === DEFAULT_ID) {
                    toast.error("Cannot delete default portfolio")
                    return
                }

                set(state => {
                    const portfolio = state.portfolios[id]
                    // Security check (client-side)
                    if (userId && portfolio.ownerId !== userId) return state

                    const { [id]: deleted, ...rest } = state.portfolios

                    // Find a new ID to select
                    const remaining = Object.values(rest).filter(p => userId ? p.ownerId === userId : !p.ownerId)
                    const newId = remaining.length > 0 ? remaining[0].id : (userId ? '' : DEFAULT_ID)

                    return {
                        portfolios: rest,
                        currentPortfolioId: newId
                    }
                })
                toast.success("Portfolio deleted")
            },

            selectPortfolio: (id) => set({ currentPortfolioId: id }),

            addToPortfolio: (ticker, name, type = 'Stock', extras) => {
                const { portfolios, currentPortfolioId, userId, createPortfolio } = get()

                // If no portfolio selected (e.g. new user), create one first
                let targetId = currentPortfolioId
                if (!portfolios[targetId] || (userId && portfolios[targetId].ownerId !== userId)) {
                    // Try to find one
                    const userPortfolios = Object.values(portfolios).filter(p => p.ownerId === userId)
                    if (userPortfolios.length > 0) {
                        targetId = userPortfolios[0].id
                        set({ currentPortfolioId: targetId })
                    } else {
                        // Create default
                        const newId = 'my-portfolio-' + Date.now()
                        set(state => ({
                            portfolios: {
                                ...state.portfolios,
                                [newId]: { id: newId, name: 'My Portfolio', type: 'tracker', items: [], ownerId: userId || undefined }
                            },
                            currentPortfolioId: newId
                        }))
                        targetId = newId
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
                    ticker,
                    name,
                    type,
                    allocation: 0, // Default for simulator
                    shares: extras?.shares || 0,
                    avgPrice: extras?.avgPrice || 0,
                    expenseRatio: extras?.expenseRatio || 0,
                    sector: extras?.sector
                }

                // If simulator, try to set default allocation
                if (current.type === 'simulator') {
                    const currentAlloc = current.items.reduce((sum, p) => sum + p.allocation, 0)
                    const remainingAlloc = Math.max(0, 100 - currentAlloc)
                    newItem.allocation = remainingAlloc > 0 ? 5 : 0
                }

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [targetId]: {
                            ...current,
                            items: [...current.items, newItem]
                        }
                    }
                }))
                toast.success(`Added ${ticker}`)
            },

            removeFromPortfolio: (ticker) => {
                const { currentPortfolioId } = get()
                if (!currentPortfolioId) return

                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: {
                            ...state.portfolios[currentPortfolioId],
                            items: state.portfolios[currentPortfolioId].items.filter(p => p.ticker !== ticker)
                        }
                    }
                }))
                toast.success(`Removed ${ticker}`)
            },

            updateAllocation: (ticker, allocation) => {
                const { currentPortfolioId } = get()
                if (!currentPortfolioId) return
                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: {
                            ...state.portfolios[currentPortfolioId],
                            items: state.portfolios[currentPortfolioId].items.map(p =>
                                p.ticker === ticker ? { ...p, allocation: Math.max(0, Math.min(100, allocation)) } : p
                            )
                        }
                    }
                }))
            },

            updateHolding: (ticker, shares, avgPrice) => {
                const { currentPortfolioId } = get()
                if (!currentPortfolioId) return
                set(state => ({
                    portfolios: {
                        ...state.portfolios,
                        [currentPortfolioId]: {
                            ...state.portfolios[currentPortfolioId],
                            items: state.portfolios[currentPortfolioId].items.map(p =>
                                p.ticker === ticker ? { ...p, shares, avgPrice } : p
                            )
                        }
                    }
                }))
            }
        }),
        {
            name: 'myrizq-portfolio-storage-v3', // New storage key version to Wipe Old Guest Data
            onRehydrateStorage: () => (state) => {
                // Migration logic could go here, but for now we just start fresh or use v3
            }
        }
    )
)
