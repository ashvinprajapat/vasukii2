'use client'

import { Popover } from '@base-ui/react/popover'
import { Bell, BellOff, Menu as MenuIcon, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useCurrentUser, useNotifications } from '@/lib/api/hooks'
import { greetingFor, longDate, relativeTime, roleLabel } from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { DataState, SkeletonRows } from './data-state'
import { popupClass, ProfileMenu } from './profile-menu'
import { ThemeToggle } from './theme-toggle'

const iconButton =
  'relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function Greeting() {
  const now = useNow()
  const { data: user } = useCurrentUser()
  const firstName = user?.name.split(/\s+/)[0]
  return (
    <div className="hidden min-w-0 flex-col leading-tight sm:flex">
      <p className="truncate text-sm font-semibold text-foreground">
        {now ? greetingFor(now) : '\u00a0'}
        {now && firstName ? `, ${firstName}` : ''}
      </p>
      <p className="truncate whitespace-nowrap text-xs text-muted-foreground">{now ? longDate(now) : '\u00a0'}</p>
    </div>
  )
}

function NotificationsPanel() {
  const query = useNotifications()
  const unread = query.data?.filter((n) => !n.read).length ?? 0
  return (
    <Popover.Root>
      <Popover.Trigger
        className={iconButton}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
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
              {unread > 0 && <span className="text-[11px] text-muted-foreground">{unread} unread</span>}
            </div>
            <div className="max-h-96 overflow-y-auto p-1.5">
              <DataState
                query={query}
                loading={<SkeletonRows rows={2} className="p-2.5" />}
                pending="Notifications will appear here once Vasukii is connected to the campus backend."
                empty={{ icon: BellOff, title: 'No notifications yet', description: 'Updates about your bookings will show up here.' }}
              >
                {(items) => (
                  <ul className="flex flex-col">
                    {items.slice(0, 6).map((n) => (
                      <li key={n.id} className="flex gap-3 rounded-xl p-2.5">
                        <span
                          className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium text-foreground">{n.title}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </DataState>
            </div>
            <div className="border-t border-border p-1.5">
              <Popover.Close
                render={<Link href="/notifications" />}
                className="block w-full rounded-xl py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-accent"
              >
                View all notifications
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form
      role="search"
      className="ml-auto w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        const q = new FormData(e.currentTarget).get('q')?.toString().trim()
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
      }}
    >
      <label htmlFor="global-search" className="sr-only">
        Search Vasukii
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id="global-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search venues, bookings, services…"
          className="h-10 w-full rounded-xl border border-input bg-card pr-12 pl-9 text-sm text-foreground placeholder:text-muted-foreground/80 transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/15 focus:outline-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:block">
          ⌘K
        </kbd>
      </div>
    </form>
  )
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { data: user } = useCurrentUser()
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMobile} className={cn(iconButton, 'lg:hidden')} aria-label="Open navigation">
          <MenuIcon className="size-[18px]" />
        </button>

        <Greeting />
        <GlobalSearch />

        {user && (
          <span className="hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground xl:inline-flex">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {roleLabel[user.role]}
          </span>
        )}

        <ThemeToggle className={iconButton} />
        <NotificationsPanel />
        <ProfileMenu variant="topbar" />
      </div>
    </header>
  )
}
