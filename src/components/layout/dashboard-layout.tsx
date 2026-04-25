'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  History,
  ArrowRight,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/types'
import { BUSINESS_TYPES } from '@/lib/constants'
import { useDashboardContext } from '@/context/dashboard-context'
import { DailyBriefingModal } from '@/components/dashboard/daily-briefing-modal'

interface DashboardLayoutProps {
  children: React.ReactNode
  business: Business
  criticalItemsCount?: number
  rulesConfigured?: boolean
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/briefings', label: 'Briefings', icon: History },
  { href: '/chatbot', label: 'AI Assistant', icon: MessageSquare, subtitle: 'Ask Zara' },
  { href: '/customization', label: 'Customization', icon: Settings2, subtitle: 'Rules & preferences' },
]

export function DashboardLayoutClient({ children, business, criticalItemsCount = 0, rulesConfigured = true }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { unreadChatCount, setUnreadChatCount } = useDashboardContext()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const businessTypeLabel =
    BUSINESS_TYPES.find((t) => t.value === business.type)?.label || business.type

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const handleNavClick = (href: string) => {
    // Clear unread count when visiting chatbot
    if (href === '/chatbot') {
      setUnreadChatCount(0)
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Daily Briefing Modal - Shows on login */}
      <DailyBriefingModal businessId={business.id} businessName={business.name} />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 bg-background border-r z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg">FnB.ai</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <div>
                    {item.label}
                    {item.subtitle && (
                      <span className={`block text-[11px] font-normal ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {item.href === '/inventory' && criticalItemsCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {criticalItemsCount}
                  </Badge>
                )}
                {item.href === '/chatbot' && unreadChatCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {unreadChatCount}
                  </span>
                )}
                {item.href === '/customization' && !rulesConfigured && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Configure your business rules" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Zara Card (desktop only) */}
        <div className="px-3 pb-2">
          <Link
            href="/chatbot"
            onClick={() => setUnreadChatCount(0)}
            className="block rounded-xl bg-primary/5 border border-border p-3 hover:bg-primary/10 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 shadow-sm">
                Z
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Ask Zara anything</p>
                <p className="text-[10px] text-muted-foreground">AI-powered insights</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Bottom: business info + logout */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{business.name}</p>
            <Badge variant="secondary" className="text-xs shrink-0">
              {businessTypeLabel}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">FnB.ai</span>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {business.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-lg md:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-semibold text-lg">FnB.ai</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleNavClick(item.href)
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <div>
                        {item.label}
                        {item.subtitle && (
                          <span className={`block text-[11px] font-normal ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.href === '/inventory' && criticalItemsCount > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                        {criticalItemsCount}
                      </Badge>
                    )}
                    {item.href === '/chatbot' && unreadChatCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {unreadChatCount}
                      </span>
                    )}
                    {item.href === '/customization' && !rulesConfigured && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Configure your business rules" />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{business.name}</p>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {businessTypeLabel}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="md:ml-60">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
