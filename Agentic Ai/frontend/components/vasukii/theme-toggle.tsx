'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label="Toggle dark mode"
      title="Toggle light / dark mode"
    >
      <Sun className="size-[18px] dark:hidden" />
      <Moon className="hidden size-[18px] dark:block" />
    </button>
  )
}
