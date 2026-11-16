'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { swrKeys } from '@/lib/api/hooks'
import { authService, type SignUpInput } from '@/lib/api/services'
import { useSubmit } from '@/lib/use-submit'
import { cn } from '@/lib/utils'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
] as const

export function SignUpForm() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { submit, pending, error, result } = useSubmit(authService.signUp)
  const [role, setRole] = useState<SignUpInput['role']>('student')

  if (result?.requiresEmailConfirmation) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground" role="status">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-muted-foreground">
          We sent a confirmation link to your university email. Confirm it, then sign in.
        </p>
      </div>
    )
  }

  return (
    <form
      className="mt-6 flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const redirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/sign-in`
        const res = await submit({
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          password: String(data.get('password') ?? ''),
          department: String(data.get('department') ?? '').trim() || undefined,
          role,
          redirect_to: redirect,
        })
        if (!res || res.requiresEmailConfirmation || !res.accessToken) return
        await mutate(() => true, undefined, { revalidate: false })
        if (res.user) await mutate(swrKeys.me, res.user, { revalidate: true })
        router.replace('/')
      }}
    >
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-medium text-foreground">I am a</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {roles.map((r) => (
            <label
              key={r.value}
              className={cn(
                'flex h-9 cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                role === r.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Full name" htmlFor="name">
        <input id="name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
      </Field>
      <Field label="University email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="username" placeholder="name@jklu.edu.in" className={inputClass} />
      </Field>
      <Field label="Department" htmlFor="department" hint="Optional">
        <input id="department" name="department" maxLength={120} autoComplete="organization-title" className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters">
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <SubmitFeedback error={error} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  )
}
