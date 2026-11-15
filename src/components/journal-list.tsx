"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { Memory, Trip } from "@/lib/types"
import { formatMonth, formatRange, plural } from "@/lib/format"
import { tripRange } from "@/lib/trips"
import { MemoryEntry, MemoryTile } from "@/components/memory-card"

type Section =
  | { kind: "trip"; key: string; trip: Trip; memories: Memory[] }
  | { kind: "month"; key: string; label: string; memories: Memory[] }

/** Groups consecutive memories (newest first) by trip, otherwise by month. */
function sections(memories: Memory[], trips: Trip[]): Section[] {
  const tripById = new Map(trips.map((t) => [t.id, t]))
  const out: Section[] = []
  for (const m of memories) {
    const trip = m.tripId ? tripById.get(m.tripId) : undefined
    const key = trip ? `trip:${trip.id}` : `month:${m.visitedOn.slice(0, 7)}`
    const last = out.at(-1)
    if (last && last.key === key) last.memories.push(m)
    else if (trip) out.push({ kind: "trip", key, trip, memories: [m] })
    else out.push({ kind: "month", key, label: formatMonth(m.visitedOn), memories: [m] })
  }
  return out
}

/** Chronological journal: each trip or month is one grouped list, rows split by hairlines. */
export function JournalTimeline({ memories, trips, allMemories }: { memories: Memory[]; trips: Trip[]; allMemories: Memory[] }) {
  return (
    <div className="space-y-7">
      {sections(memories, trips).map((s, i) => {
        const range = s.kind === "trip" ? tripRange(s.trip, allMemories) : null
        return (
          <section key={`${s.key}-${i}`} aria-labelledby={`sec-${i}`}>
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              {s.kind === "trip" ? (
                <Link href={`/trips/${s.trip.id}`} className="group flex min-w-0 items-baseline gap-2">
                  <h2 id={`sec-${i}`} className="truncate text-[15px] group-hover:text-brand">{s.trip.name}</h2>
                  <span className="shrink-0 text-[12px] text-muted-foreground">{formatRange(range!.start, range!.end)}</span>
                  <ChevronRight className="size-3.5 shrink-0 self-center text-muted-foreground" aria-hidden />
                </Link>
              ) : (
                <h2 id={`sec-${i}`} className="text-[15px]">{s.label}</h2>
              )}
              <span className="shrink-0 text-[12px] text-muted-foreground">{plural(s.memories.length, "memory", "memories")}</span>
            </div>
            <ul className="surface divide-y divide-hairline overflow-hidden rounded-2xl">
              {s.memories.map((m) => (
                <li key={m.id}>
                  <MemoryEntry memory={m} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export function JournalGrid({ memories }: { memories: Memory[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 xl:grid-cols-4">
      {memories.map((m) => (
        <li key={m.id}>
          <MemoryTile memory={m} />
        </li>
      ))}
    </ul>
  )
}
