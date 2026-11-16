'use client'

import {
  BedDouble,
  Building2,
  CalendarCheck,
  CarFront,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UniversityLogo, VasukiiWordmark } from './brand'

const primaryNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#', active: true },
  { label: 'AI Assistant', icon: Sparkles, href: '#' },
  { label: 'Classroom Booking', icon: Building2, href: '#' },
  { label: 'MDC Guest House', icon: BedDouble, href: '#' },
  { label: 'Parking', icon: CarFront, href: '#' },
  { label: 'My Bookings', icon: CalendarCheck, href: '#' },
]

const accountNav = [
  { label: 'Profile', icon: UserRound, href: '#' },
  { label: 'Settings', icon: Settings, href: '#' },
]

type NavItem = (typeof primaryNav)[number] & { active?: boolean }

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <a
      href={item.href}
      aria-current={item.active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        item.active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/75 hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      {item.active && (
        <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary" aria-hidden="true" />
      )}
      <Icon className={cn('size-[18px] shrink-0', item.active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
    </a>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const content = (isMobile: boolean) => {
    const isCollapsed = !isMobile && collapsed
    return (
      <div className="flex h-full flex-col">
        <div className={cn('flex h-16 items-center px-4', isCollapsed ? 'justify-center' : 'justify-between')}>
          <VasukiiWordmark collapsed={isCollapsed} />
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-4">
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                Workspace
              </p>
            )}
            {primaryNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={isCollapsed} />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                Account
              </p>
            )}
            {accountNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
          {!isCollapsed && (
            <div className="rounded-xl bg-muted/70 p-3">
              <UniversityLogo />
            </div>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              {!isCollapsed && <span>Collapse</span>}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:block',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        {content(false)}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          {...(!mobileOpen && { inert: true })}
        >
          {content(true)}
        </aside>
      </div>
    </>
  )
}
