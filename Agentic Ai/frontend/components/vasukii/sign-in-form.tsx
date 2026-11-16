'use client'

import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { swrKeys } from '@/lib/api/hooks'
import { authService } from '@/lib/api/services'
import { useSubmit } from '@/lib/use-submit'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'

export function SignInForm() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { submit, pending, error } = useSubmit(authService.signIn)

  return (
    <form
      className="mt-6 flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const result = await submit({
          email: String(data.get('email') ?? '').trim(),
          password: String(data.get('password') ?? ''),
        })
        if (!result) return
        await mutate(() => true, undefined, { revalidate: false })
        if (result.user) await mutate(swrKeys.me, result.user, { revalidate: true })
        router.replace('/')
      }}
    >
      <Field label="University email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="username" placeholder="name@jklu.edu.in" className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <SubmitFeedback error={error} />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  )
}
