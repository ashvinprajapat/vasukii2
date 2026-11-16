'use client'

import { BedDouble } from 'lucide-react'
import { useSWRConfig } from 'swr'
import { swrKeys, useGuestHouseInfo } from '@/lib/api/hooks'
import { guestHouseService } from '@/lib/api/services'
import { useSubmit } from '@/lib/use-submit'
import { cn } from '@/lib/utils'
import { DataState } from './data-state'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'

export function GuestHouse() {
  const info = useGuestHouseInfo()
  const { mutate } = useSWRConfig()
  const request = useSubmit(guestHouseService.request)

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Panel className="lg:col-span-2" title="Accommodation">
        <DataState
          query={info}
          isEmpty={(d) => d.sections.length === 0}
          pending="Guest house information will appear here once Vasukii is connected to the campus backend."
          empty={{ icon: BedDouble, title: 'No accommodation information published' }}
        >
          {(d) => (
            <div className="flex flex-col gap-4">
              {d.sections.map((s) => (
                <div key={s.title}>
                  <h3 className="text-[13.5px] font-medium text-foreground">{s.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground whitespace-pre-line">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </DataState>
      </Panel>

      <div id="request" className="scroll-mt-24 lg:col-span-3">
        <Panel title="Request a stay" description="Requests are reviewed by the guest house office.">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              const d = new FormData(e.currentTarget)
              const result = await request.submit({
                guestName: String(d.get('guestName')).trim(),
                guestPhone: String(d.get('guestPhone')).trim(),
                checkIn: String(d.get('checkIn')),
                checkOut: String(d.get('checkOut')),
                guests: Number(d.get('guests')),
                purpose: String(d.get('purpose')).trim(),
              })
              if (result) mutate(swrKeys.requests)
            }}
          >
            <Field label="Guest name" htmlFor="guestName">
              <input id="guestName" name="guestName" required maxLength={120} autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Guest phone" htmlFor="guestPhone">
              <input id="guestPhone" name="guestPhone" type="tel" required pattern="[0-9+ \-]{7,16}" className={inputClass} />
            </Field>
            <Field label="Check-in" htmlFor="checkIn">
              <input id="checkIn" name="checkIn" type="date" required className={inputClass} />
            </Field>
            <Field label="Check-out" htmlFor="checkOut">
              <input id="checkOut" name="checkOut" type="date" required className={inputClass} />
            </Field>
            <Field label="Number of guests" htmlFor="guests">
              <input id="guests" name="guests" type="number" min={1} max={20} defaultValue={1} required className={inputClass} />
            </Field>
            <Field label="Purpose of visit" htmlFor="purpose" className="sm:col-span-2">
              <textarea id="purpose" name="purpose" required maxLength={500} rows={3} className={cn(inputClass, 'h-auto py-2')} />
            </Field>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <SubmitFeedback
                error={request.error}
                success={
                  request.result && (
                    <span className="flex flex-wrap items-center gap-2">
                      Request received. <StatusBadge status={request.result.status} />
                    </span>
                  )
                }
              />
              <SubmitButton pending={request.pending} className="self-start">
                Submit request
              </SubmitButton>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  )
}
