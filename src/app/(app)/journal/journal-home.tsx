"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Camera, ChevronRight, MapPin, PenLine, Plus, SearchX } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { JournalGrid, JournalTimeline } from "@/components/journal-list"
import { FiltersBar } from "@/components/filters-bar"
import { MemoriesMap } from "@/components/map/memories-map"
import { MemoryPhoto } from "@/components/memory-photo"
import { PageContainer, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { allTags, applyFilters, filtersFromParams, filtersToParams, isFiltering, type MemoryFilters } from "@/lib/filters"
import { formatRange, greeting, plural } from "@/lib/format"
import { tripCoverPath, tripRange } from "@/lib/trips"
import { cn } from "@/lib/utils"

type View = "timeline" | "grid"

export function JournalHome() {
  const { memories, trips, profile } = useData()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const view: View = params.get("view") === "grid" ? "grid" : "timeline"
  const filters = filtersFromParams(params)

  const setParams = (next: URLSearchParams) => {
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  const setFilters = (f: MemoryFilters) => setParams(filtersToParams(f, params))
  const setView = (v: View) => {
    const next = new URLSearchParams(params)
    if (v === "grid") next.set("view", "grid")
    else next.delete("view")
    setParams(next)
  }

  const results = useMemo(() => applyFilters(memories, trips, filters), [memories, trips, filters])
  const tags = useMemo(() => allTags(memories), [memories])
  const filtering = isFiltering(filters)

  if (memories.length === 0) return <FirstMemory name={profile?.displayName} />

  return (
    <PageContainer>
      <header className="flex items-end justify-between gap-4">
        <PageTitle subtitle={`${plural(memories.length, "memory", "memories")} in ${plural(trips.length, "trip")}`}>
          {greeting(profile?.displayName)}
        </PageTitle>
        <Link href="/memories/new" className={cn(buttonVariants(), "hidden h-9 px-4 sm:inline-flex lg:hidden")}>
          <Plus data-icon="inline-start" /> Add a memory
        </Link>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {!filtering && <RecentStrip />}

          <div className="glass sticky top-[56px] z-20 -mx-2 rounded-[22px] p-2 lg:top-4">
            <div className="mb-2 flex items-center justify-between gap-2 pl-2">
              <h2 className="text-[15px]">{filtering ? "Results" : "Journal"}</h2>
              <Segmented value={view} onChange={setView} />
            </div>
            <FiltersBar filters={filters} onChange={setFilters} tags={tags} resultCount={results.length} totalCount={memories.length} />
          </div>

          <div className="mt-5">
            {results.length === 0 ? (
              <div className="surface rounded-2xl px-6 py-12 text-center">
                <SearchX className="mx-auto mb-3 size-5 text-muted-foreground" strokeWidth={1.6} aria-hidden />
                <p className="text-[15px] font-semibold">No memories match</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Try another word, or widen the dates.</p>
                <button
                  type="button"
                  onClick={() => setFilters({ q: "", from: "", to: "", tags: [] })}
                  className="mt-4 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand hover:bg-brand-soft"
                >
                  Show all memories
                </button>
              </div>
            ) : view === "grid" ? (
              <JournalGrid memories={results} />
            ) : (
              <JournalTimeline memories={results} trips={trips} allMemories={memories} />
            )}
          </div>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-10 lg:self-start" aria-label="At a glance">
          <section aria-labelledby="map-preview">
            <SideHeading id="map-preview" title="Where you've been" href="/map" link="Map" />
            <Link href="/map" aria-label="Open the map" className="block overflow-hidden rounded-[18px]">
              <MemoriesMap memories={filtering ? results : memories} compact className="h-48" />
            </Link>
          </section>
          <TripsSummary />
        </aside>
      </div>
    </PageContainer>
  )
}

function SideHeading({ id, title, href, link }: { id: string; title: string; href: string; link: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <h2 id={id} className="text-[15px]">{title}</h2>
      <Link href={href} className="text-[13px] font-semibold text-brand hover:underline">{link}</Link>
    </div>
  )
}

/** Apple-style segmented control. */
function Segmented({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const opts: { v: View; label: string }[] = [
    { v: "timeline", label: "Timeline" },
    { v: "grid", label: "Photos" },
  ]
  return (
    <div role="group" aria-label="Journal layout" className="inline-flex rounded-full bg-black/[0.05] p-0.5">
      {opts.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "h-7 rounded-full px-3.5 text-[12px] font-semibold text-muted-foreground transition-colors",
            value === v && "surface text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function RecentStrip() {
  const { memories } = useData()
  const recent = [...memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  return (
    <section aria-labelledby="recent" className="mb-8">
      <h2 id="recent" className="mb-2.5 px-1 text-[15px]">Recently added</h2>
      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 sm:-mx-8 sm:scroll-px-8 sm:px-8">
        {recent.map((m) => (
          <li key={m.id} className="w-[132px] shrink-0 snap-start">
            <Link href={`/memories/${m.id}`} className="group block">
              <MemoryPhoto path={m.photoPath} alt={m.placeName} className="aspect-square w-full rounded-2xl" />
              <p className="mt-1.5 truncate px-0.5 text-[12px] font-semibold group-hover:text-brand">{m.placeName}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TripsSummary() {
  const { trips, memories } = useData()
  return (
    <section aria-labelledby="trips-summary">
      <SideHeading id="trips-summary" title="Trips" href="/trips" link="All trips" />
      {trips.length === 0 ? (
        <p className="surface rounded-2xl p-3.5 text-[13px] text-muted-foreground">
          Group memories from one journey on the <Link href="/trips" className="font-semibold text-brand">Trips</Link> page.
        </p>
      ) : (
        <ul className="surface divide-y divide-hairline overflow-hidden rounded-2xl">
          {trips.slice(0, 4).map((t) => {
            const r = tripRange(t, memories)
            const count = memories.filter((m) => m.tripId === t.id).length
            return (
              <li key={t.id}>
                <Link href={`/trips/${t.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-black/[0.02]">
                  <MemoryPhoto path={tripCoverPath(t, memories)} alt="" className="size-10 shrink-0 rounded-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{t.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {formatRange(r.start, r.end)}, {plural(count, "memory", "memories")}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function FirstMemory({ name }: { name?: string | null }) {
  const steps = [
    { icon: MapPin, title: "Choose the place", text: "Search for it, use where you are, or type its name." },
    { icon: Camera, title: "Add a photo", text: "The one that brings it back. That's enough to save." },
    { icon: PenLine, title: "Add the rest later", text: "Notes, dates, tags and trips can wait until you're home." },
  ]
  return (
    <PageContainer className="max-w-xl">
      <PageTitle subtitle="Your journal is empty. Save your first place.">{greeting(name)}</PageTitle>
      <ol className="surface mt-8 divide-y divide-hairline overflow-hidden rounded-2xl">
        {steps.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3.5 px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon className="size-4" strokeWidth={1.8} aria-hidden />
            </span>
            <span>
              <span className="block text-[14px] font-semibold">{title}</span>
              <span className="block text-[13px] text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <Link href="/memories/new" className={cn(buttonVariants(), "mt-6 h-10 w-full px-5 sm:w-auto")}>
        <Plus data-icon="inline-start" /> Add your first memory
      </Link>
    </PageContainer>
  )
}
