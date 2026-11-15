"use client"

import { useEffect, useMemo, useState } from "react"
import { Expand, List, MapPin, Search, Shrink, X } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { MemoriesMap } from "@/components/map/memories-map"
import { MemoryPhoto } from "@/components/memory-photo"
import { Input } from "@/components/ui/input"
import { applyFilters, emptyFilters } from "@/lib/filters"
import { formatDate, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

const floatingButton =
  "glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-foreground hover:bg-white/80"

/** Full-bleed map; places float beside it on a glass panel (desktop) or sheet (mobile). */
export function MapScreen() {
  const { memories, trips } = useData()
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const shown = useMemo(() => applyFilters(memories, trips, { ...emptyFilters, q }), [memories, trips, q])

  useEffect(() => {
    if (!full && !listOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setFull(false)
      setListOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [full, listOpen])

  return (
    <div className={cn("relative h-[calc(100dvh-3rem)] lg:h-dvh", full && "fixed inset-0 z-50 h-dvh")}>
      <h1 className="sr-only">Map of your memories</h1>

      <MemoriesMap
        memories={shown}
        selectedId={selected}
        onSelect={setSelected}
        className="size-full"
        previewClassName="bottom-[88px] lg:bottom-4 lg:left-[352px]"
        insetLeft={wide ? 340 : 0}
      />

      <section
        aria-label="Places on the map"
        className={cn(
          "glass-strong absolute z-20 flex-col overflow-hidden rounded-[26px]",
          "lg:top-4 lg:bottom-4 lg:left-4 lg:flex lg:w-[320px]",
          listOpen ? "inset-x-3 top-3 bottom-[88px] flex" : "hidden",
        )}
      >
        <div className="flex items-center gap-2 p-3 pb-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Filter places"
              placeholder="Filter places"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-full border-transparent bg-black/[0.05] pl-9 focus-visible:bg-card"
            />
          </div>
          <button
            type="button"
            onClick={() => setListOpen(false)}
            aria-label="Close the list"
            className="flex size-9 items-center justify-center rounded-full hover:bg-black/[0.05] lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="px-4 pb-1.5 text-[12px] text-muted-foreground" aria-live="polite">{plural(shown.length, "place")}</p>
        <ul className="flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
          {shown.map((m) => {
            const isSelected = selected === m.id
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(m.id)
                    setListOpen(false)
                  }}
                  aria-pressed={isSelected}
                  disabled={m.latitude === null}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-black/[0.04] disabled:opacity-55",
                    isSelected && "bg-brand-soft hover:bg-brand-soft",
                  )}
                >
                  <MemoryPhoto path={m.photoPath} alt="" className="size-11 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className={cn("block truncate text-[13px] font-semibold", isSelected && "text-brand")}>{m.placeName}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {m.latitude === null ? "No location saved" : formatDate(m.visitedOn, "short")}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {shown.length === 0 && (
            <li className="p-6 text-center text-[13px] text-muted-foreground">
              <MapPin className="mx-auto mb-2 size-5" strokeWidth={1.6} aria-hidden />
              {memories.length ? "No places match that filter." : "Places you save appear here."}
            </li>
          )}
        </ul>
      </section>

      {/* Mobile controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 lg:hidden">
        <button type="button" className={floatingButton} onClick={() => setListOpen(true)}>
          <List className="size-4" aria-hidden /> Places
        </button>
        <button type="button" className={floatingButton} onClick={() => setFull((f) => !f)} aria-pressed={full}>
          {full ? <Shrink className="size-4" aria-hidden /> : <Expand className="size-4" aria-hidden />}
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </div>
  )
}
