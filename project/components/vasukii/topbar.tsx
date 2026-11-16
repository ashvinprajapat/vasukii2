'use client'

import { Menu } from '@base-ui/react/menu'
import { Popover } from '@base-ui/react/popover'
import { Bell, ChevronDown, LogOut, Menu as MenuIcon, Search, Settings, UserRound } from 'lucide-react'
import { DEMO_NOTIFICATIONS, DEMO_USER } from '@/lib/demo-data'
import { cn } from '@/lib/utils'
import { DemoTag } from './status-badge'
import { ThemeToggle } from './theme-toggle'

const popupClass =
  'origin-[var(--transform-origin)] rounded-2xl border border-border bg-popover/95 shadow-[0_12px_40px_-12px_rgba(16,24,20,0.18)] backdrop-blur-xl outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0'

const iconButton =
  'relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function NotificationsPanel() {
  const unread = DEMO_NOTIFICATIONS.filter((n) => n.unread).length
  return (
    <Popover.Root>
      <Popover.Trigger className={iconButton} aria-label={`Notifications, ${unread} unread`}>
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-brick ring-2 ring-card" aria-hidden="true" />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align="end" className="z-50">
          <Popover.Popup className={cn(popupClass, 'w-[min(22rem,calc(100vw-2rem))]')}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Popover.Title className="text-sm font-semibold">Notifications</Popover.Title>
              <DemoTag />
            </div>
            <ul className="flex flex-col p-1.5">
              {DEMO_NOTIFICATIONS.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.unread ? 'bg-primary' : 'bg-border')}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-foreground">{n.title}</span>
                        <span className="text-[11px] text-muted-foreground">{n.time}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-1.5">
              <button
                type="button"
                className="w-full rounded-xl py-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
              >
                View all notifications
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ProfileMenu() {
  const itemClass =
    'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[highlighted]:bg-muted'
  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1 pr-2.5 pl-1 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Open profile menu"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
          {DEMO_USER.initials}
        </span>
        <span className="hidden shrink-0 flex-col items-start leading-tight lg:flex">
          <span className="whitespace-nowrap text-[13px] font-medium text-foreground">{DEMO_USER.name}</span>
          <span className="text-[11px] text-muted-foreground">{DEMO_USER.role}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end" className="z-50">
          <Menu.Popup className={cn(popupClass, 'w-60 p-1.5')}>
            <div className="px-2.5 pt-2 pb-3">
              <p className="text-[13px] font-medium text-foreground">{DEMO_USER.name}</p>
              <p className="truncate text-xs text-muted-foreground">{DEMO_USER.email}</p>
            </div>
            <div className="mb-1 h-px bg-border" />
            <Menu.Item className={itemClass}>
              <UserRound className="size-4 text-muted-foreground" /> Profile
            </Menu.Item>
            <Menu.Item className={itemClass}>
              <Settings className="size-4 text-muted-foreground" /> Settings
            </Menu.Item>
            <div className="my-1 h-px bg-border" />
            <Menu.Item className={cn(itemClass, 'text-destructive')}>
              <LogOut className="size-4" /> Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMobile} className={cn(iconButton, 'lg:hidden')} aria-label="Open navigation">
          <MenuIcon className="size-[18px]" />
        </button>

        <div className="hidden min-w-0 flex-col leading-tight sm:flex">
          <p className="truncate text-sm font-semibold text-foreground" suppressHydrationWarning>
            {greeting()}, {DEMO_USER.firstName}
          </p>
          <p className="truncate whitespace-nowrap text-xs text-muted-foreground">Tuesday, 17 November</p>
        </div>

        <form role="search" className="ml-auto w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="global-search" className="sr-only">
            Search Vasukii
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="global-search"
              type="search"
              placeholder="Search venues, bookings, services…"
              className="h-10 w-full rounded-xl border border-input bg-card pr-12 pl-9 text-sm text-foreground placeholder:text-muted-foreground/80 transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/15 focus:outline-none"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:block">
              ⌘K
            </kbd>
          </div>
        </form>

        <span className="hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground xl:inline-flex">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {DEMO_USER.role}
        </span>

        <ThemeToggle className={iconButton} />
        <NotificationsPanel />
        <ProfileMenu />
      </div>
    </header>
  )
}
