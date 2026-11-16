import type { Metadata } from 'next'
import { UniversityLogo, VasukiiWordmark } from '@/components/vasukii/brand'
import { SignInForm } from '@/components/vasukii/sign-in-form'

export const metadata: Metadata = { title: 'Sign in — Vasukii' }

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <VasukiiWordmark collapsed={false} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,20,0.04)] sm:p-8">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in with your JKLU university account.</p>
          <SignInForm />
        </div>
        <div className="mt-6 flex justify-center">
          <UniversityLogo />
        </div>
      </div>
    </main>
  )
}
