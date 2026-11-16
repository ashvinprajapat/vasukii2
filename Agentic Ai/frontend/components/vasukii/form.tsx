'use client'

import { CheckCircle2, CircleAlert, Loader2, PlugZap } from 'lucide-react'
import { isIntegrationPending, userMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-10 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/80 transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/15 focus:outline-none disabled:opacity-60'

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SubmitButton({
  pending,
  children,
  className,
  disabled,
}: {
  pending: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60',
        className,
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

/** Feedback after a submission. Success is only shown for a confirmed backend response. */
export function SubmitFeedback({ error, success }: { error: unknown; success?: React.ReactNode }) {
  if (error) {
    const pending = isIntegrationPending(error)
    const Icon = pending ? PlugZap : CircleAlert
    return (
      <div
        role="alert"
        className={cn(
          'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px]',
          pending ? 'border-border bg-muted/60 text-foreground' : 'border-destructive/20 bg-destructive/6 text-destructive',
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" />
        <p>{userMessage(error)}</p>
      </div>
    )
  }
  if (success) {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-success/20 bg-success/8 px-3.5 py-3 text-[13px] text-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
        <div>{success}</div>
      </div>
    )
  }
  return null
}
