import type { Metadata } from 'next'
import { SearchResults } from '@/components/vasukii/account'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'Search — Vasukii' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  return (
    <PageContainer narrow>
      <PageHeader title="Search" description="Venues, bookings and campus services." />
      <SearchResults q={q.trim().slice(0, 200)} />
    </PageContainer>
  )
}
