'use client'

import { Building2, SearchX, Users } from 'lucide-react'
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { swrKeys } from '@/lib/api/hooks'
import type { Venue, VenueKind } from '@/lib/api/schemas'
import { venueService, type VenueSearchInput } from '@/lib/api/services'
import { useSubmit } from '@/lib/use-submit'
import { cn } from '@/lib/utils'
import { StateMessage } from './data-state'
import { Field, inputClass, SubmitButton, SubmitFeedback } from './form'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'

const kinds: { value: VenueKind; label: string }[] = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'lab', label: 'Lab' },
  { value: 'amphitheatre', label: 'Amphitheatre' },
]

export function VenueBooking({ initialKind }: { initialKind: VenueKind }) {
  const { mutate } = useSWRConfig()
  const [kind, setKind] = useState<VenueKind>(initialKind)
  const [criteria, setCriteria] = useState<VenueSearchInput | null>(null)
  const [selected, setSelected] = useState<Venue | null>(null)
  const search = useSubmit(venueService.searchAvailable)
  const book = useSubmit(venueService.requestBooking)

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Find an available venue">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            const d = new FormData(e.currentTarget)
            const attendees = Number(d.get('attendees'))
            const input: VenueSearchInput = {
              kind,
              date: String(d.get('date')),
              startTime: String(d.get('startTime')),
              endTime: String(d.get('endTime')),
              attendees: attendees > 0 ? attendees : undefined,
            }
            setCriteria(input)
            setSelected(null)
            book.reset()
            search.submit(input)
          }}
        >
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-xs font-medium text-foreground">Venue type</legend>
            <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
              {kinds.map((k) => (
                <label
                  key={k.value}
                  className={cn(
                    'cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                    kind === k.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
                  {k.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Date" htmlFor="date">
            <input id="date" name="date" type="date" required className={inputClass} />
          </Field>
          <Field label="Attendees" htmlFor="attendees" hint="Optional">
            <input id="attendees" name="attendees" type="number" min={1} max={2000} inputMode="numeric" className={inputClass} />
          </Field>
          <Field label="Start time" htmlFor="startTime">
            <input id="startTime" name="startTime" type="time" required className={inputClass} />
          </Field>
          <Field label="End time" htmlFor="endTime">
            <input id="endTime" name="endTime" type="time" required className={inputClass} />
          </Field>
          <div className="sm:col-span-2 flex flex-col gap-3">
            <SubmitFeedback error={search.error} />
            <SubmitButton pending={search.pending} className="self-start">
              Search availability
            </SubmitButton>
          </div>
        </form>
      </Panel>

      {search.result && criteria && (
        <Panel title="Available venues" description="Returned by the campus booking system">
          {search.result.length === 0 ? (
            <StateMessage icon={SearchX} title="No venues available" description="Try a different date or time." />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {search.result.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.id === v.id}
                    onClick={() => {
                      setSelected(v)
                      book.reset()
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                      selected?.id === v.id ? 'border-primary bg-accent/60' : 'border-border hover:bg-muted',
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Building2 className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-foreground">{v.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {v.building}
                        {v.capacity != null && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" />
                            {v.capacity}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {selected && criteria && (
        <Panel title={`Request ${selected.name}`}>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const purpose = String(new FormData(e.currentTarget).get('purpose') ?? '').trim()
              const result = await book.submit({ ...criteria, venueId: selected.id, purpose })
              if (result) {
                mutate(swrKeys.requests)
                mutate(swrKeys.bookings)
              }
            }}
          >
            <Field label="Purpose" htmlFor="purpose">
              <textarea id="purpose" name="purpose" required maxLength={500} rows={3} className={cn(inputClass, 'h-auto py-2')} />
            </Field>
            <SubmitFeedback
              error={book.error}
              success={
                book.result && (
                  <span className="flex flex-wrap items-center gap-2">
                    Request submitted for {book.result.label}. <StatusBadge status={book.result.status} />
                  </span>
                )
              }
            />
            {!book.result && (
              <SubmitButton pending={book.pending} className="self-start">
                Submit booking request
              </SubmitButton>
            )}
          </form>
        </Panel>
      )}
    </div>
  )
}
