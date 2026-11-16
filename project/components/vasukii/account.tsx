'use client'

import { BellOff, Monitor, Moon, SearchX, Sun, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { useSWRConfig } from 'swr'
import { swrKeys, useCurrentUser, useNotifications, useSearch } from '@/lib/api/hooks'
import { authService } from '@/lib/api/services'
import { relativeTime, roleLabel } from '@/lib/format'
import { useSubmit } from '@/lib/use-submit'
import { cn } from '@/lib/utils'
import { DataState, SkeletonRows } from './data-state'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'
import { Panel } from './panel'

export function ProfileDetails() {
  const query = useCurrentUser()
  const { mutate } = useSWRConfig()
  const update = useSubmit(authService.updateProfile)

  return (
    <DataState
      query={query}
      isEmpty={() => false}
      loading={<SkeletonRows rows={2} />}
      pending="Your profile will appear here once sign-in is connected to the campus backend."
      empty={{ icon: UserRound, title: 'Not signed in' }}
    >
      {(user) => (
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel className="lg:col-span-2" title="Account">
            <dl className="flex flex-col gap-3 text-[13px]">
              {[
                ['Name', user.name],
                ['University email', user.email],
                ['Role', roleLabel[user.role]],
                ['Department', user.department ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 break-words font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <div id="edit" className="scroll-mt-24 lg:col-span-3">
            <Panel title="Update profile">
              <form
                className="flex flex-col gap-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const d = new FormData(e.currentTarget)
                  const result = await update.submit({
                    name: String(d.get('name')).trim(),
                    department: String(d.get('department')).trim() || undefined,
                  })
                  if (result) mutate(swrKeys.me, result, { revalidate: false })
                }}
              >
                <Field label="Full name" htmlFor="name">
                  <input id="name" name="name" required maxLength={120} defaultValue={user.name} className={inputClass} />
                </Field>
                <Field label="Department" htmlFor="department">
                  <input id="department" name="department" maxLength={120} defaultValue={user.department ?? ''} className={inputClass} />
                </Field>
                <SubmitFeedback error={update.error} success={update.result && 'Profile updated.'} />
                <SubmitButton pending={update.pending} className="self-start">
                  Save changes
                </SubmitButton>
              </form>
            </Panel>
          </div>
        </div>
      )}
    </DataState>
  )
}

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

const subscribeNoop = () => () => {}

export function ThemePreferences() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)
  return (
    <div id="appearance" className="scroll-mt-24">
      <Panel title="Theme preferences" description="Choose how Vasukii looks on this device.">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => {
            const active = mounted && theme === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-[13px] font-medium transition-colors',
                  active ? 'border-primary bg-accent/60 text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

export function NotificationList() {
  const query = useNotifications()
  return (
    <Panel title="All notifications">
      <DataState
        query={query}
        pending="Notifications will appear here once Vasukii is connected to the campus backend."
        empty={{ icon: BellOff, title: 'No notifications yet' }}
      >
        {(items) => (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium text-foreground">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DataState>
    </Panel>
  )
}

export function SearchResults({ q }: { q: string }) {
  const query = useSearch(q)
  if (!q) return <Panel title="Search">{<p className="text-sm text-muted-foreground">Enter a term in the search bar above.</p>}</Panel>
  return (
    <Panel title={`Results for “${q}”`}>
      <DataState
        query={query}
        pending="Search will work once Vasukii is connected to the campus backend’s search."
        empty={{ icon: SearchX, title: 'No matches', description: 'Try another venue, booking or service name.' }}
      >
        {(items) => (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((r) => {
              const body = (
                <>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{r.type}</span>
                  <span className="block text-[13.5px] font-medium text-foreground">{r.title}</span>
                  {r.subtitle && <span className="block text-xs text-muted-foreground">{r.subtitle}</span>}
                </>
              )
              return (
                <li key={`${r.type}-${r.id}`} className="py-3 first:pt-0 last:pb-0">
                  {r.href ? (
                    <Link href={r.href} className="block rounded-lg hover:text-primary">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </DataState>
    </Panel>
  )
}
