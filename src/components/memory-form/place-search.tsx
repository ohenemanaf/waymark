"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Loader2, MapPin, Search } from "lucide-react"
import { searchPlaces, type PlaceResult } from "@/lib/mapbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Status = "idle" | "loading" | "done" | "error"

/** Accessible combobox for Mapbox place search. */
export function PlaceSearch({ onPick }: { onPick: (p: PlaceResult) => void }) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlaceResult[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when the query is too short
      setResults([])
      setStatus("idle")
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setStatus("loading")
      try {
        const r = await searchPlaces(q, ctrl.signal)
        setResults(r)
        setActive(r.length ? 0 : -1)
        setStatus("done")
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error")
      }
    }, 300)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => {
    const close = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const pick = (p: PlaceResult) => {
    onPick(p)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === "Escape") setOpen(false)
  }

  const listId = `${id}-list`
  const showList = open && query.trim().length >= 2

  return (
    <div ref={wrap} className="relative">
      <Label htmlFor={`${id}-input`} className="sr-only">Search for a place</Label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        placeholder="Search for a place, café, landmark…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 rounded-full pl-9"
      />
      {status === "loading" && (
        <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
      )}
      <p className="sr-only" aria-live="polite">
        {status === "loading" ? "Searching" : status === "done" && showList ? `${results.length} places found` : ""}
      </p>

      {showList && (
        <div className="glass-strong absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl p-1">
          {status === "error" ? (
            <p className="p-3 text-sm text-muted-foreground">Place search isn&apos;t responding. Type the place name below instead.</p>
          ) : status === "done" && results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No places found. Try another spelling, or type the name below.</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Places">
              {results.map((r, i) => (
                <li
                  key={r.id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(r)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2", i === active && "bg-black/[0.05]")}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{r.name}</span>
                    {r.address && <span className="block truncate text-[12px] text-muted-foreground">{r.address}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
