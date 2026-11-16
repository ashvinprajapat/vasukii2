'use client'

import { ArrowUp, CircleAlert, PlugZap, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { isIntegrationPending, userMessage } from '@/lib/api/errors'
import { assistantService, type ChatTurn } from '@/lib/api/services'
import { cn } from '@/lib/utils'

type Message = ChatTurn & { id: string }

const suggestions = ['Book a seminar hall for Friday', 'Is guest house room available?', 'Where can I park today?']

export function AssistantChat({ initialPrompt }: { initialPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState(initialPrompt ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending, error])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return
    const history: ChatTurn[] = messages.map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: message }])
    setDraft('')
    setError(null)
    setPending(true)
    abortRef.current = new AbortController()
    try {
      const reply = await assistantService.send({ message, history }, abortRef.current.signal)
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: reply }])
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      aria-label="Conversation with Vasukii"
      className="flex min-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,20,0.04)]"
    >
      <div className="flex-1 overflow-y-auto p-5" role="log" aria-live="polite" aria-busy={pending}>
        {messages.length === 0 && !pending && !error ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="mt-4 font-serif text-2xl text-foreground">How can I help today?</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs text-foreground transition-colors hover:border-primary/30 hover:bg-accent/60"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {messages.map((m) => (
              <li key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start gap-2.5')}>
                {m.role === 'assistant' && (
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <Sparkles className="size-3.5" />
                  </span>
                )}
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap',
                    m.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground',
                  )}
                >
                  <span className="sr-only">{m.role === 'user' ? 'You: ' : 'Vasukii: '}</span>
                  {m.content}
                </p>
              </li>
            ))}
            {pending && (
              <li className="flex gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3" aria-label="Vasukii is responding">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </li>
            )}
            {error != null && (
              <li role="alert" className="flex items-start gap-2 rounded-xl border border-border bg-muted/60 px-3.5 py-3 text-[13px] text-foreground">
                {isIntegrationPending(error) ? (
                  <>
                    <PlugZap className="mt-0.5 size-4 shrink-0 text-primary" />
                    Vasukii isn’t connected to the AI agent yet, so this message wasn’t answered.
                  </>
                ) : (
                  <>
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    {userMessage(error, 'Vasukii couldn’t respond. Please try again.')}
                  </>
                )}
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Message Vasukii
        </label>
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
          <textarea
            id="assistant-input"
            rows={1}
            value={draft}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey) return
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              send(draft)
            }}
            placeholder="Ask about venues, bookings, parking…"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="Send message"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </section>
  )
}
