import type { Metadata } from 'next'
import { ProfileDetails } from '@/components/vasukii/account'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'Profile — Vasukii' }

export default function ProfilePage() {
  return (
    <PageContainer>
      <PageHeader title="Profile" description="Your JKLU account details." />
      <ProfileDetails />
    </PageContainer>
  )
}
