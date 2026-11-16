import { cn } from '@/lib/utils'

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,20,0.04)]',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 px-5 pb-5">{children}</div>
    </section>
  )
}
