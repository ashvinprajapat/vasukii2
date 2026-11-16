import Image from 'next/image'
import { cn } from '@/lib/utils'

export function CollegeLogoMark({ className, alt = '' }: { className?: string; alt?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white',
        className,
      )}
    >
      <Image
        src="/images/jklu-logo.png"
        alt={alt}
        width={72}
        height={72}
        className="size-full scale-[1.35] object-contain"
        priority
      />
    </span>
  )
}

export function VasukiiWordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <CollegeLogoMark alt={collapsed ? 'JK Lakshmipat University' : ''} />
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[0.22em] text-foreground">VASUKII</span>
          <span className="mt-1 text-[10.5px] font-medium tracking-wide text-muted-foreground">Campus Intelligence</span>
        </div>
      )}
    </div>
  )
}

export function UniversityLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <CollegeLogoMark className="size-10" alt={compact ? 'JK Lakshmipat University' : ''} />
      {!compact && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-medium text-foreground">JK Lakshmipat University</span>
          <span className="text-[11px] text-muted-foreground">Jaipur, Rajasthan</span>
        </div>
      )}
    </div>
  )
}
