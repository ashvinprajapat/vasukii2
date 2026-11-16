import type { Metadata } from 'next'
import { ThemePreferences } from '@/components/vasukii/account'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'Settings — Vasukii' }

export default function SettingsPage() {
  return (
    <PageContainer narrow>
      <PageHeader title="Account settings" description="Manage how Vasukii works for you." />
      <ThemePreferences />
    </PageContainer>
  )
}
