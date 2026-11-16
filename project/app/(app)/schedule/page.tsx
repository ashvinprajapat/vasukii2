import type { Metadata } from 'next'
import { ScheduleList } from '@/components/vasukii/bookings-overview'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'My Schedule — Vasukii' }

export default function SchedulePage() {
  return (
    <PageContainer narrow>
      <PageHeader title="My schedule" description="Your approved bookings and campus commitments." />
      <ScheduleList />
    </PageContainer>
  )
}
