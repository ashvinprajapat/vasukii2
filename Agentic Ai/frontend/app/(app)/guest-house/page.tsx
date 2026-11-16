import type { Metadata } from 'next'
import { GuestHouse } from '@/components/vasukii/guest-house'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'MDC Guest House — Vasukii' }

export default function GuestHousePage() {
  return (
    <PageContainer>
      <PageHeader title="MDC Guest House" description="Accommodation information and stay requests for campus guests." />
      <GuestHouse />
    </PageContainer>
  )
}
