import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'
import { VenueBooking } from '@/components/vasukii/venue-booking'
import { venueKindSchema } from '@/lib/api/schemas'

export const metadata: Metadata = { title: 'Book a venue — Vasukii' }

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const kind = venueKindSchema.safeParse(type)
  return (
    <PageContainer narrow>
      <PageHeader
        title="Book a venue"
        description="Search available classrooms, labs and the amphitheatre, then submit a booking request for review."
      />
      <VenueBooking initialKind={kind.success ? kind.data : 'classroom'} />
    </PageContainer>
  )
}
