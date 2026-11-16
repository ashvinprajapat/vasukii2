import type { Metadata } from 'next'
import { NotificationList } from '@/components/vasukii/account'
import { PageContainer, PageHeader } from '@/components/vasukii/page-header'

export const metadata: Metadata = { title: 'Notifications — Vasukii' }

export default function NotificationsPage() {
  return (
    <PageContainer narrow>
      <PageHeader title="Notifications" />
      <NotificationList />
    </PageContainer>
  )
}
