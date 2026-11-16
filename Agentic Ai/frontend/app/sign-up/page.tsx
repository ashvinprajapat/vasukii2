import type { Metadata } from 'next'
import Link from 'next/link'
import { UniversityLogo, VasukiiWordmark } from '@/components/vasukii/brand'
import { SignUpForm } from '@/components/vasukii/sign-up-form'

export const metadata: Metadata = { title: 'Create account — Vasukii' }

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <VasukiiWordmark collapsed={false} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,20,0.04)] sm:p-8">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">For JKLU students and faculty.</p>
          <SignUpForm />
          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <UniversityLogo />
        </div>
      </div>
    </main>
  )
}
