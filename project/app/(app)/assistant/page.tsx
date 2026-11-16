import type { Metadata } from 'next'
import { AssistantChat } from '@/components/vasukii/assistant-chat'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'Ask Vasukii — Vasukii' }

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <PageContainer narrow>
      <PageHeader title="Ask Vasukii" description="Your campus assistant for spaces, bookings and services at JKLU." />
      <AssistantChat initialPrompt={q?.slice(0, 500)} />
    </PageContainer>
  )
}
