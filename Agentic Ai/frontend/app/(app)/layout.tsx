import { AppShell } from '@/components/vasukii/app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
