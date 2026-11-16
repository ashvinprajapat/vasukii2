import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/lib/api/schemas'

const styles: Record<BookingStatus, { label: string; className: string; dot: string }> = {
  approved: { label: 'Approved', className: 'bg-success/10 text-success ring-success/20', dot: 'bg-success' },
  pending: { label: 'Pending', className: 'bg-warning/12 text-[oklch(0.5_0.11_70)] dark:text-warning ring-warning/30', dot: 'bg-warning' },
  rejected: { label: 'Rejected', className: 'bg-destructive/8 text-destructive ring-destructive/20', dot: 'bg-destructive' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground ring-border', dot: 'bg-muted-foreground' },
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const s = styles[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        s.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}
