import { AppShell } from '@/components/vasukii/app-shell'
import {
  QuickShortcuts,
  RecentActivity,
  RequestStatus,
  UpcomingBookings,
} from '@/components/vasukii/dashboard-widgets'
import { Hero } from '@/components/vasukii/hero'
import { ServiceCards } from '@/components/vasukii/service-cards'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <Hero />
        <ServiceCards />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <UpcomingBookings />
            <QuickShortcuts />
          </div>
          <div className="flex flex-col gap-4">
            <RequestStatus />
            <RecentActivity />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
