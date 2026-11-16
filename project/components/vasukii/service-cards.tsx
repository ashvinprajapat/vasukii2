import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BedDouble, Building2, CarFront, Monitor, Presentation, type LucideIcon } from 'lucide-react'

type Service = {
  title: string
  description: string
  action: string
  image: string
  alt: string
  icon: LucideIcon
  href: string
}

const services: Service[] = [
  {
    title: 'Classroom Booking',
    description: 'Find and reserve classrooms and seminar halls for lectures and sessions.',
    action: 'Find a classroom',
    image: '/images/classroom.png',
    alt: 'A faculty member teaching students seated at tiered wooden desks in a JKLU classroom',
    icon: Building2,
    href: '/bookings/new?type=classroom',
  },
  {
    title: 'Lab Booking',
    description: 'Reserve computer and research labs for practicals, projects and workshops.',
    action: 'Book a lab',
    image: '/images/lab.png',
    alt: 'Students coding at desktop workstations in a campus computer lab',
    icon: Monitor,
    href: '/bookings/new?type=lab',
  },
  {
    title: 'Amphitheatre',
    description: 'Book the amphitheatre for guest lectures, seminars and events.',
    action: 'Reserve amphitheatre',
    image: '/images/amphitheatre.png',
    alt: 'Curved tiered seating facing a speaker at the podium in the campus amphitheatre',
    icon: Presentation,
    href: '/bookings/new?type=amphitheatre',
  },
  {
    title: 'MDC Guest House',
    description: 'Explore guest accommodation and submit requests.',
    action: 'Request a stay',
    image: '/images/guest-house.png',
    alt: 'A bright guest house room with white bedding',
    icon: BedDouble,
    href: '/guest-house',
  },
  {
    title: 'Smart Parking',
    description: 'Discover parking availability and campus parking information.',
    action: 'View parking',
    image: '/images/parking.png',
    alt: 'A tree-lined campus parking area',
    icon: CarFront,
    href: '/parking',
  },
]

export function ServiceCards() {
  return (
    <section aria-labelledby="services-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="services-title" className="text-base font-semibold text-foreground">
            Campus services
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Everything you need, in one place.</p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s, i) => {
          const Icon = s.icon
          return (
            <li key={s.title} className={i === 0 ? 'sm:col-span-2 xl:col-span-1' : undefined}>
              <Link
                href={s.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,20,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(20,60,40,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div
                  className={`relative overflow-hidden bg-muted ${i === 0 ? 'aspect-[16/10] sm:aspect-[21/8] xl:aspect-[16/10]' : 'aspect-[16/10]'}`}
                >
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover brightness-[1.04] contrast-[1.08] saturate-[1.12] transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10"
                  />
                  <span className="absolute top-3 left-3 flex size-9 items-center justify-center rounded-xl border border-white/40 bg-white/75 text-primary dark:border-white/10 dark:bg-black/55 shadow-sm backdrop-blur-md">
                    <Icon className="size-[18px]" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[15px] font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{s.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                    {s.action}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
