'use client'

import { GraduationCap } from 'lucide-react'
import { useCurrentUser } from '@/lib/api/hooks'
import { roleLabel } from '@/lib/format'

export function HeroRoleBadge() {
  const { data: user } = useCurrentUser()
  if (!user) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md">
      <GraduationCap className="size-3" />
      {roleLabel[user.role]}
      {user.department ? ` · ${user.department}` : ''}
    </span>
  )
}

export function HeroGreeting() {
  const { data: user } = useCurrentUser()
  if (!user) return null
  const firstName = user.name.split(/\s+/)[0]
  return <p className="mb-3 text-sm font-medium text-white/80">Welcome back, {firstName}</p>
}
