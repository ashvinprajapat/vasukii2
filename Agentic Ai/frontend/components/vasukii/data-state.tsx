'use client'

import { CircleAlert, PlugZap, RotateCw, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { isIntegrationPending, isUnauthorized, userMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

type Query<T> = {
  data: T | undefined
  error: unknown
  isLoading: boolean
  mutate: () => unknown
}

export function StateMessage({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'neutral' | 'error'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-8 text-center', className)}>
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          tone === 'error' ? 'bg-destructive/8 text-destructive' : 'bg-accent text-primary',
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-3 text-[13.5px] font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PendingState({ description, className }: { description: string; className?: string }) {
  return <StateMessage icon={PlugZap} title="Not connected yet" description={description} className={className} />
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  if (isUnauthorized(error)) {
    return (
      <StateMessage
        icon={CircleAlert}
        tone="error"
        title="Please sign in again"
        description={userMessage(error)}
        className={className}
        action={
          <Link href="/sign-in" className="text-xs font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        }
      />
    )
  }
  return (
    <StateMessage
      icon={CircleAlert}
      tone="error"
      title="Couldn’t load this"
      description={userMessage(error)}
      className={className}
      action={
        onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCw className="size-3.5" />
            Try again
          </button>
        )
      }
    />
  )
}

export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Renders loading, not-connected, error, empty and data states for an SWR query. */
export function DataState<T>({
  query,
  pending,
  empty,
  isEmpty = (d) => Array.isArray(d) && d.length === 0,
  loading = <SkeletonRows />,
  children,
}: {
  query: Query<T>
  pending: string
  empty: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }
  isEmpty?: (data: T) => boolean
  loading?: React.ReactNode
  children: (data: T) => React.ReactNode
}) {
  if (query.isLoading) return <>{loading}</>
  if (query.error) {
    if (isIntegrationPending(query.error)) return <PendingState description={pending} />
    return <ErrorState error={query.error} onRetry={() => query.mutate()} />
  }
  if (query.data === undefined || isEmpty(query.data)) return <StateMessage {...empty} />
  return <>{children(query.data)}</>
}
