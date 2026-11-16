const LOCALE = 'en-IN'

const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })
const dayFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const longDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' })
const relativeFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

function toDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function dayParts(iso: string) {
  const d = toDate(iso)
  return d ? { weekday: weekdayFmt.format(d), day: dayFmt.format(d) } : { weekday: '—', day: '—' }
}

export function longDate(iso: string | Date) {
  const d = typeof iso === 'string' ? toDate(iso) : iso
  return d ? longDateFmt.format(d) : ''
}

export function timeRange(start: string, end?: string | null) {
  const s = toDate(start)
  if (!s) return ''
  const e = end ? toDate(end) : null
  return e ? `${timeFmt.format(s)} – ${timeFmt.format(e)}` : timeFmt.format(s)
}

export function relativeTime(iso: string, now = Date.now()) {
  const d = toDate(iso)
  if (!d) return ''
  const seconds = Math.round((d.getTime() - now) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFmt.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function greetingFor(date: Date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export const roleLabel = { student: 'Student', faculty: 'Faculty' } as const

export const serviceLabel = {
  classroom: 'Classroom Booking',
  lab: 'Lab Booking',
  amphitheatre: 'Amphitheatre',
  'guest-house': 'MDC Guest House',
  parking: 'Parking',
} as const
