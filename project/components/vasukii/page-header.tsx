import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function PageHeader({
  title,
  description,
  action,
  back = { href: '/', label: 'Dashboard' },
}: {
  title: string
  description?: string
  action?: React.ReactNode
  back?: { href: string; label: string } | null
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function PageContainer({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto flex flex-col gap-6 ${narrow ? 'max-w-3xl' : 'max-w-[1400px]'}`}>{children}</div>
}
