'use client'

import { CarFront } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { swrKeys, useParkingInfo } from '@/lib/api/hooks'
import { parkingService } from '@/lib/api/services'
import { useSubmit } from '@/lib/use-submit'
import { cn } from '@/lib/utils'
import { DataState } from './data-state'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'

export function Parking() {
  const info = useParkingInfo()
  const { mutate } = useSWRConfig()
  const request = useSubmit(parkingService.visitorRequest)

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Panel className="lg:col-span-2" title="Parking zones">
        <DataState
          query={info}
          isEmpty={(d) => d.zones.length === 0}
          pending="Parking information will appear here once Vasukii is connected to the campus backend."
          empty={{ icon: CarFront, title: 'No parking zones published' }}
        >
          {(d) => (
            <ul className="flex flex-col divide-y divide-border">
              {d.zones.map((z) => (
                <li key={z.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground">{z.name}</p>
                    {z.description && <p className="mt-0.5 text-xs text-muted-foreground">{z.description}</p>}
                  </div>
                  {z.available != null && (
                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                      <span className="block text-base font-semibold text-foreground">{z.available}</span>
                      {z.capacity != null ? `of ${z.capacity} free` : 'free'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </Panel>

      <div id="visitor-request" className="scroll-mt-24 lg:col-span-3">
        <Panel title="Visitor parking request" description="Request a pass for a visitor’s vehicle.">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              const d = new FormData(e.currentTarget)
              const result = await request.submit({
                visitorName: String(d.get('visitorName')).trim(),
                vehicleNumber: String(d.get('vehicleNumber')).trim().toUpperCase(),
                date: String(d.get('date')),
                startTime: String(d.get('startTime')),
                endTime: String(d.get('endTime')),
                purpose: String(d.get('purpose')).trim(),
              })
              if (result) mutate(swrKeys.requests)
            }}
          >
            <Field label="Visitor name" htmlFor="visitorName">
              <input id="visitorName" name="visitorName" required maxLength={120} autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Vehicle number" htmlFor="vehicleNumber">
              <input id="vehicleNumber" name="vehicleNumber" required maxLength={15} placeholder="RJ14 AB 1234" className={cn(inputClass, 'uppercase')} />
            </Field>
            <Field label="Date" htmlFor="date" className="sm:col-span-2">
              <input id="date" name="date" type="date" required className={inputClass} />
            </Field>
            <Field label="Arrival" htmlFor="startTime">
              <input id="startTime" name="startTime" type="time" required className={inputClass} />
            </Field>
            <Field label="Departure" htmlFor="endTime">
              <input id="endTime" name="endTime" type="time" required className={inputClass} />
            </Field>
            <Field label="Purpose" htmlFor="purpose" className="sm:col-span-2">
              <textarea id="purpose" name="purpose" required maxLength={300} rows={2} className={cn(inputClass, 'h-auto py-2')} />
            </Field>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <SubmitFeedback
                error={request.error}
                success={
                  request.result && (
                    <span className="flex flex-wrap items-center gap-2">
                      Visitor pass requested. <StatusBadge status={request.result.status} />
                    </span>
                  )
                }
              />
              <SubmitButton pending={request.pending} className="self-start">
                Request visitor pass
              </SubmitButton>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  )
}
