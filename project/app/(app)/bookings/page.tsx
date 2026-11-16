import type { Metadata } from 'next'
import { BookingsOverview } from '@/components/vasukii/bookings-overview'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'My Bookings — Vasukii' }

export default function BookingsPage() {
  return (
    <PageContainer>
      <PageHeader title="My bookings" description="Upcoming reservations and the status of every request you’ve made." />
      <BookingsOverview />
    </PageContainer>
  )
}
