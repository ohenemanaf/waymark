"use client"

import { useState } from "react"
import { Check, Search, SlidersHorizontal, X } from "lucide-react"
import type { MemoryFilters } from "@/lib/filters"
import { isFiltering } from "@/lib/filters"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  filters: MemoryFilters
  onChange: (f: MemoryFilters) => void
  tags: string[]
  resultCount: number
  totalCount: number
}

export function FiltersBar({ filters, onChange, tags, resultCount, totalCount }: Props) {
  const advancedCount = filters.tags.length + (filters.from ? 1 : 0) + (filters.to ? 1 : 0)
  const [open, setOpen] = useState(advancedCount > 0)
  const active = isFiltering(filters)
  const toggleTag = (t: string) =>
    onChange({ ...filters, tags: filters.tags.includes(t) ? filters.tags.filter((x) => x !== t) : [...filters.tags, t] })

  return (
    <div role="search" aria-label="Search and filter memories">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Label htmlFor="memory-search" className="sr-only">Search memories</Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="memory-search"
            type="search"
            placeholder="Search places, notes and trips"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            className="rounded-full border-transparent bg-black/[0.045] pl-9 focus-visible:bg-card"
          />
        </div>
        <Button
          variant="outline"
          className={cn("h-9 px-3.5", advancedCount > 0 && "text-brand")}
          aria-expanded={open}
          aria-controls="filter-panel"
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal data-icon="inline-start" />
          Filters{advancedCount > 0 && ` (${advancedCount})`}
        </Button>
      </div>

      {open && (
        <div id="filter-panel" className="animate-rise mt-2 space-y-4 rounded-2xl bg-card/70 p-3.5">
          <fieldset className="grid grid-cols-2 gap-2 sm:max-w-sm">
            <legend className="mb-2 text-[12px] font-semibold text-muted-foreground">Visited between</legend>
            <div className="space-y-1">
              <Label htmlFor="from" className="text-[12px] font-medium">From</Label>
              <Input id="from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => onChange({ ...filters, from: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-[12px] font-medium">To</Label>
              <Input id="to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => onChange({ ...filters, to: e.target.value })} />
            </div>
          </fieldset>
          {tags.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-[12px] font-semibold text-muted-foreground">Tags</legend>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const on = filters.tags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-full px-3 text-[12px] font-medium transition-colors",
                        on ? "bg-brand-soft text-brand" : "bg-secondary text-foreground/75 hover:bg-black/[0.08]",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={2.5} aria-hidden />}
                      {t}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}
        </div>
      )}

      <div aria-live="polite">
        {active && (
          <div className="mt-2 flex items-center justify-between px-1 text-[12px] text-muted-foreground">
            <span>
              {resultCount} of {totalCount} memories
            </span>
            <button
              type="button"
              onClick={() => onChange({ q: "", from: "", to: "", tags: [] })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-brand hover:bg-brand-soft"
            >
              <X className="size-3.5" aria-hidden /> Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
