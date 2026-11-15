"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Route, Sparkles, X } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { PageContainer, PageTitle } from "@/components/page"
import { MemoryPhoto } from "@/components/memory-photo"
import { TripDialog } from "@/components/trip-dialog"
import { Button } from "@/components/ui/button"
import { formatRange, plural } from "@/lib/format"
import { suggestTrips, tripCoverPath, tripRange, type TripSuggestion } from "@/lib/trips"

const DISMISSED_KEY = "waymark:dismissed-suggestions"

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function TripsScreen() {
  const { trips, memories } = useData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage
  useEffect(() => setDismissed(readDismissed()), [])

  const suggestions = useMemo(() => suggestTrips(memories, dismissed), [memories, dismissed])

  const dismiss = (key: string) => {
    const next = [...dismissed, key]
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {}
  }

  return (
    <PageContainer>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle subtitle={`${plural(trips.length, "trip")}, with ${plural(memories.filter((m) => !m.tripId).length, "memory", "memories")} not in one yet`}>
          Trips
        </PageTitle>
        <Button className="h-9 px-4" onClick={() => setCreating(true)}>
          <Plus data-icon="inline-start" /> New trip
        </Button>
      </header>

      {suggestions.length > 0 && (
        <section aria-labelledby="suggested" className="mt-8">
          <h2 id="suggested" className="flex items-center gap-1.5 px-1 text-[15px]">
            <Sparkles className="size-4 text-brand" strokeWidth={1.8} aria-hidden /> Suggested
          </h2>
          <p className="mt-0.5 mb-3 px-1 text-[13px] text-muted-foreground">
            These memories are close together in time and place.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((s) => (
              <SuggestionCard key={s.key} suggestion={s} onDismiss={() => dismiss(s.key)} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-trips" className="mt-10">
        <h2 id="all-trips" className="sr-only">Your trips</h2>
        {trips.length === 0 ? (
          <div className="surface rounded-2xl px-6 py-12 text-center">
            <Route className="mx-auto mb-3 size-5 text-muted-foreground" strokeWidth={1.6} aria-hidden />
            <p className="text-[15px] font-semibold">No trips yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
              Trips collect memories from one journey. Create one, or save a few memories close together and Waymark will
              suggest one.
            </p>
            <Button variant="outline" className="mt-5 h-9 px-4" onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" /> Create a trip
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => {
              const r = tripRange(t, memories)
              const count = memories.filter((m) => m.tripId === t.id).length
              return (
                <li key={t.id}>
                  <Link href={`/trips/${t.id}`} className="group relative block overflow-hidden rounded-[22px] bg-muted">
                    <MemoryPhoto
                      path={tripCoverPath(t, memories)}
                      alt={`Cover of ${t.name}`}
                      fallbackLabel="No cover yet"
                      className="aspect-[5/4] w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.02]"
                    />
                    <div className="glass-dark absolute inset-x-2 bottom-2 rounded-2xl px-3.5 py-2.5">
                      <h3 className="truncate text-[15px] text-white">{t.name}</h3>
                      <p className="text-[12px] text-white/80">
                        {formatRange(r.start, r.end)}, {plural(count, "memory", "memories")}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <TripDialog open={creating} onOpenChange={setCreating} onCreated={(t) => router.push(`/trips/${t.id}`)} />
    </PageContainer>
  )
}

function SuggestionCard({ suggestion, onDismiss }: { suggestion: TripSuggestion; onDismiss: () => void }) {
  const { memories, createTrip } = useData()
  const [busy, setBusy] = useState(false)
  const items = memories.filter((m) => suggestion.memoryIds.includes(m.id))

  const accept = async () => {
    setBusy(true)
    try {
      const t = await createTrip(
        { name: suggestion.name, startDate: suggestion.startDate, endDate: suggestion.endDate, coverPhotoPath: items.find((m) => m.photoPath)?.photoPath ?? null },
        suggestion.memoryIds,
      )
      toast.success(`Created “${t.name}” with ${plural(items.length, "memory", "memories")}`)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <li className="surface rounded-2xl p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{suggestion.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {formatRange(suggestion.startDate, suggestion.endDate)}, {plural(items.length, "memory", "memories")}
          </p>
        </div>
        <button type="button" onClick={onDismiss} aria-label={`Dismiss suggestion ${suggestion.name}`} className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/[0.05]">
          <X className="size-4" />
        </button>
      </div>
      <ul className="mt-3 flex gap-1.5" aria-label="Memories in this suggestion">
        {items.slice(0, 5).map((m) => (
          <li key={m.id}>
            <MemoryPhoto path={m.photoPath} alt={m.placeName} className="size-12 rounded-xl" />
          </li>
        ))}
      </ul>
      <Button size="sm" className="mt-3.5 px-3.5" onClick={accept} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
        Create this trip
      </Button>
    </li>
  )
}
