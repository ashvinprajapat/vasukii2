'use client'

import { Menu } from '@base-ui/react/menu'
import { ChevronDown, ChevronsUpDown, LogIn, LogOut, Palette, Settings, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { isIntegrationPending } from '@/lib/api/errors'
import { useCurrentUser } from '@/lib/api/hooks'
import { authService } from '@/lib/api/services'
import { clearSession } from '@/lib/api/session'
import { initials, roleLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

export const popupClass =
  'origin-[var(--transform-origin)] rounded-2xl border border-border bg-popover/95 shadow-[0_12px_40px_-12px_rgba(16,24,20,0.18)] backdrop-blur-xl outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0'

const itemClass =
  'flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[highlighted]:bg-muted'

function Avatar({ name, avatarUrl, className }: { name?: string; avatarUrl?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-xs font-semibold text-primary-foreground',
        !name && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar host is unknown until the backend contract is confirmed
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : name ? (
        initials(name)
      ) : (
        <UserRound className="size-4" />
      )}
    </span>
  )
}

function useSignOut() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  return async () => {
    try {
      await authService.signOut()
    } catch (error) {
      if (!isIntegrationPending(error)) console.error('[v0] Sign out failed', error)
    }
    clearSession()
    await mutate(() => true, undefined, { revalidate: false })
    router.replace('/sign-in')
  }
}

export function ProfileMenu({ variant }: { variant: 'topbar' | 'sidebar' }) {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()
  const signOut = useSignOut()

  const name = user?.name
  const subtitle = user ? roleLabel[user.role] : isLoading ? 'Loading…' : 'Not signed in'

  if (!user && !isLoading && variant === 'topbar') {
    return (
      <button
        type="button"
        onClick={() => router.push('/sign-in')}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        <LogIn className="size-4 text-muted-foreground" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    )
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'flex items-center gap-2.5 rounded-xl transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          variant === 'topbar' ? 'border border-border bg-card py-1 pr-2.5 pl-1' : 'w-full p-2 text-left',
        )}
        aria-label="Open profile menu"
      >
        <Avatar name={name} avatarUrl={user?.avatarUrl} />
        <span
          className={cn(
            'min-w-0 flex-col items-start leading-tight',
            variant === 'topbar' ? 'hidden shrink-0 lg:flex' : 'flex flex-1',
          )}
        >
          <span className="max-w-full truncate whitespace-nowrap text-[13px] font-medium text-foreground">
            {name ?? (isLoading ? '' : 'Guest')}
          </span>
          <span className="max-w-full truncate text-[11px] text-muted-foreground">
            {variant === 'sidebar' && user ? user.email : subtitle}
          </span>
        </span>
        {variant === 'topbar' ? (
          <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
        ) : (
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={10}
          align={variant === 'topbar' ? 'end' : 'start'}
          side={variant === 'topbar' ? 'bottom' : 'top'}
          className="z-50"
        >
          <Menu.Popup className={cn(popupClass, 'w-64 p-1.5')}>
            <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-3">
              <Avatar name={name} avatarUrl={user?.avatarUrl} className="size-9" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{name ?? 'Not signed in'}</p>
                <p className="truncate text-xs text-muted-foreground">{user ? user.email : 'Sign in with your university email'}</p>
                {user && (
                  <span className="mt-1 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-accent-foreground">
                    {roleLabel[user.role]}
                  </span>
                )}
              </div>
            </div>
            <div className="mb-1 h-px bg-border" />
            <Menu.Item className={itemClass} onClick={() => router.push('/profile')}>
              <UserRound className="size-4 text-muted-foreground" /> View profile
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={() => router.push('/settings')}>
              <Settings className="size-4 text-muted-foreground" /> Account settings
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={() => router.push('/settings#appearance')}>
              <Palette className="size-4 text-muted-foreground" /> Theme preferences
            </Menu.Item>
            <div className="my-1 h-px bg-border" />
            {user ? (
              <Menu.Item className={cn(itemClass, 'text-destructive')} onClick={signOut}>
                <LogOut className="size-4" /> Log out
              </Menu.Item>
            ) : (
              <Menu.Item className={itemClass} onClick={() => router.push('/sign-in')}>
                <LogIn className="size-4 text-muted-foreground" /> Sign in
              </Menu.Item>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
