import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'
import { Parking } from '@/components/vasukii/parking'

export const metadata: Metadata = { title: 'Parking — Vasukii' }

export default function ParkingPage() {
  return (
    <PageContainer>
      <PageHeader title="Smart Parking" description="Campus parking zones, availability and visitor passes." />
      <Parking />
    </PageContainer>
  )
}
