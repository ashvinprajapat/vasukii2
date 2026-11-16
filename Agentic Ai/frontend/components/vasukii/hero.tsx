import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Sparkles } from 'lucide-react'
import { HeroGreeting, HeroRoleBadge } from './hero-greeting'

const suggestions = ['Book a seminar hall for Friday', 'Is guest house room available?', 'Where can I park today?']

/** Swap `CAMPUS_IMAGE` for any authentic JKLU campus photograph. */
const CAMPUS_IMAGE = '/images/campus-hero.png'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-3xl border border-border bg-primary"
    >
      <Image
        src={CAMPUS_IMAGE}
        alt="Aerial view of the JK Lakshmipat University campus in Jaipur with brick and white academic blocks around a central lawn"
        fill
        priority
        sizes="(min-width: 1024px) 80vw, 100vw"
        className="-z-20 object-cover object-[center_60%]"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[oklch(0.2_0.04_160/0.88)] via-[oklch(0.22_0.04_160/0.55)] to-[oklch(0.22_0.04_160/0.1)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[oklch(0.18_0.04_160/0.6)] to-transparent"
        aria-hidden="true"
      />

      <div className="flex min-h-[420px] flex-col justify-between gap-10 p-6 sm:p-10 lg:min-h-[460px] lg:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md">
            <MapPin className="size-3" />
            JK Lakshmipat University · Jaipur
          </span>
          <HeroRoleBadge />
        </div>

        <div className="max-w-xl">
          <HeroGreeting />
          <h1
            id="hero-title"
            className="font-serif text-4xl leading-[1.05] tracking-tight text-balance text-white sm:text-5xl lg:text-[3.5rem]"
          >
            Your Campus, <em className="text-[oklch(0.88_0.06_150)]">Intelligently</em> Connected.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-pretty text-white/80">
            Discover spaces, manage bookings and access campus services with Vasukii.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/assistant"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[oklch(0.38_0.08_158)] shadow-lg shadow-black/10 transition-all hover:bg-[oklch(0.97_0.01_150)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Sparkles className="size-4" />
              Ask Vasukii
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/bookings/new"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              Browse venues
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">Try asking</p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <Link
                  href={`/assistant?q=${encodeURIComponent(s)}`}
                  className="inline-flex rounded-full border border-white/15 bg-black/15 px-3.5 py-1.5 text-xs text-white/90 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/15"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
