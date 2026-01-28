'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
    PieChart,
    Search,
    GitCompare,
    Briefcase,
    LineChart,
    BookOpen,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    Heart,
    Home,
    Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { usePaywall } from '@/hooks/use-paywall'

interface DashboardLayoutProps {
    user: User
    children: React.ReactNode
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { setPaywallOpen, isPremium } = usePaywall()

    const navLinks = [
        { href: "/", label: "Home", icon: Home },
        { href: "/portfolio", label: "Portfolio", icon: Briefcase },
        { href: "/screener", label: "Screener", icon: Search },
        { href: "/etfs", label: "ETFs", icon: PieChart },
        { href: "/compare", label: "Compare", icon: GitCompare },
        { href: "/analytics", label: "Analytics", icon: LineChart },
        { href: "/blog", label: "Learn", icon: BookOpen },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        toast.success('Logged out successfully')
    }

    const UserProfile = () => {
        const { isPremium } = usePaywall()

        return (
            <div className="mx-3 mb-2">
                <div
                    onClick={() => router.push('/settings')}
                    className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer transition-all shadow-sm group"
                >
                    <Avatar className="h-9 w-9 border border-gray-100 ring-2 ring-gray-50 group-hover:ring-green-100 transition-all">
                        <AvatarFallback className="bg-green-100 text-green-700 font-bold text-xs">
                            {(user.user_metadata?.username || user.email || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 group-hover:text-green-700 transition-colors">
                            {user.user_metadata?.username || user.user_metadata?.first_name || user.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-amber-400' : 'bg-gray-300'}`} />
                            <p className="text-[10px] font-medium text-muted-foreground truncate">
                                {isPremium ? 'Premium Member' : 'Free Plan'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-2 px-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 justify-start h-8 px-2 text-xs font-medium"
                    >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        )
    }

    const NavContent = () => (
        <div className="flex flex-col h-full bg-card border-r border-border">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/myrizq-logo.png"
                        alt="MyRizq"
                        width={180}
                        height={52}
                        className="h-12 w-auto"
                        priority
                    />
                </Link>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                    return (
                        <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start gap-3 relative overflow-hidden ${isActive
                                    ? 'bg-green-50 text-green-700 font-semibold hover:bg-green-100'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-r-full" />}
                                <link.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-3 mt-auto">
                {!isPremium && (
                    <div onClick={() => setPaywallOpen(true)} className="cursor-pointer">
                        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 text-white mb-4 shadow-lg shadow-green-900/5 hover:shadow-xl transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-5 h-5 fill-white/20" />
                                <h4 className="font-bold text-sm">Support Us</h4>
                            </div>
                            <p className="text-xs text-green-50 mb-3 leading-relaxed">
                                Start your halal investing journey properly with premium tools.
                            </p>
                            <Button size="sm" className="w-full bg-white text-green-700 hover:bg-green-50 border-0 h-8 font-semibold text-xs pointer-events-none">
                                Upgrade Now
                            </Button>
                        </div>
                    </div>
                )}
                <UserProfile />
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50">
                <NavContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 px-4 flex items-center justify-between">
                <Link href="/">
                    <Image
                        src="/custom-favicon.png" // Use icon for mobile header to save space
                        alt="MyRizq"
                        width={40}
                        height={40}
                        className="h-10 w-10"
                    />
                </Link>
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r w-72">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 min-h-screen transition-all duration-300">
                <div className="p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
