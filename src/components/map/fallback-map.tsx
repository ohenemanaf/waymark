"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import type { Memory } from "@/lib/types"
import { boundsOf, type Bounds, type LngLat } from "@/lib/geo"
import { cn } from "@/lib/utils"

type Props = {
  memories: (Memory & LngLat)[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  compact?: boolean
  insetLeft?: number
}

// Web Mercator, in "world units" where x ∈ [0, 1] and y ∈ [0, 1].
const project = (lng: number, lat: number) => {
  const clamped = Math.max(-85, Math.min(85, lat))
  const s = Math.sin((clamped * Math.PI) / 180)
  return { x: (lng + 180) / 360, y: 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI) }
}

type View = { x0: number; y0: number; x1: number; y1: number }

function viewFor(b: Bounds | null, aspect: number): View {
  if (!b) return { x0: 0, y0: 0.15, x1: 1, y1: 0.85 }
  const a = project(b.west, b.north)
  const c = project(b.east, b.south)
  let w = Math.max(c.x - a.x, 0.004)
  let h = Math.max(c.y - a.y, 0.004)
  // pad, then match container aspect so pins don't distort
  w *= 1.35
  h *= 1.35
  if (w / h > aspect) h = w / aspect
  else w = h * aspect
  const cx = (a.x + c.x) / 2
  const cy = (a.y + c.y) / 2
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 }
}

type Cluster = { x: number; y: number; members: (Memory & LngLat)[] }

/**
 * A lightweight map used when no Mapbox token is configured. It plots pins on a
 * projected grid, groups nearby pins, and keeps every pin keyboard reachable.
 */
export function FallbackMap({ memories, selectedId, onSelect, compact, insetLeft = 0 }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const [view, setView] = useState<View | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const home = useMemo(() => {
    // Fit into the visible area beside any floating panel, then extend the view to the left under it.
    const visible = Math.max(size.w - insetLeft, size.w * 0.4)
    const v = viewFor(boundsOf(memories), visible / size.h)
    const extra = ((v.x1 - v.x0) * (size.w - visible)) / visible
    return { ...v, x0: v.x0 - extra }
  }, [memories, size, insetLeft])
  const v = view ?? home

  const toScreen = (lng: number, lat: number) => {
    const p = project(lng, lat)
    return { x: ((p.x - v.x0) / (v.x1 - v.x0)) * size.w, y: ((p.y - v.y0) / (v.y1 - v.y0)) * size.h }
  }

  const clusters: Cluster[] = []
  for (const m of memories) {
    const s = toScreen(m.longitude, m.latitude)
    const near = clusters.find((c) => Math.hypot(c.x - s.x, c.y - s.y) < 30)
    if (near) {
      near.members.push(m)
      near.x = (near.x * (near.members.length - 1) + s.x) / near.members.length
      near.y = (near.y * (near.members.length - 1) + s.y) / near.members.length
    } else clusters.push({ ...s, members: [m] })
  }

  // If the selected pin is hidden inside a cluster, zoom in until it stands alone.
  const selectedHidden = clusters.some((c) => c.members.length > 1 && c.members.some((m) => m.id === selectedId))
  useEffect(() => {
    if (!selectedHidden) return
    const m = memories.find((x) => x.id === selectedId)
    if (!m) return
    const d = 0.05
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the view follows the selection
    setView(viewFor({ west: m.longitude - d, east: m.longitude + d, south: m.latitude - d, north: m.latitude + d }, size.w / size.h))
  }, [selectedHidden, selectedId, memories, size])

  const zoom = (factor: number) => {
    const cx = (v.x0 + v.x1) / 2
    const cy = (v.y0 + v.y1) / 2
    const w = ((v.x1 - v.x0) * factor) / 2
    const h = ((v.y1 - v.y0) * factor) / 2
    setView({ x0: cx - w, y0: cy - h, x1: cx + w, y1: cy + h })
  }

  // Graticule spacing that suits the zoom level.
  const spanDeg = (v.x1 - v.x0) * 360
  const step = spanDeg > 120 ? 30 : spanDeg > 40 ? 10 : spanDeg > 10 ? 2 : spanDeg > 2 ? 0.5 : 0.1
  const lines: { d: string; key: string }[] = []
  for (let lng = -180; lng <= 180; lng += step) {
    const x = toScreen(lng, 0).x
    if (x >= -1 && x <= size.w + 1) lines.push({ key: `x${lng}`, d: `M${x} 0V${size.h}` })
  }
  for (let lat = -80; lat <= 80; lat += step) {
    const y = toScreen(0, lat).y
    if (y >= -1 && y <= size.h + 1) lines.push({ key: `y${lat}`, d: `M0 ${y}H${size.w}` })
  }

  return (
    <div
      ref={box}
      className="relative size-full overflow-hidden bg-[#eceff2]"
      role="region"
      aria-label={`Simplified map showing ${memories.length} memories`}
      onClick={(e) => e.target === e.currentTarget && onSelect(null)}
    >
      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        {lines.map((l) => (
          <path key={l.key} d={l.d} stroke="#dfe3e8" strokeWidth="1" />
        ))}
      </svg>

      {clusters.map((c) => {
        const single = c.members.length === 1 ? c.members[0] : null
        const selected = single?.id === selectedId
        if (c.x < -20 || c.y < -20 || c.x > size.w + 20 || c.y > size.h + 20) return null
        if (compact)
          return (
            <span
              key={c.members.map((m) => m.id).join()}
              aria-hidden="true"
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white",
                single ? "size-3.5 bg-brand" : "size-6 bg-foreground text-[10px] font-semibold text-white",
              )}
              style={{ left: c.x, top: c.y }}
            >
              {single ? null : c.members.length}
            </span>
          )
        return single ? (
          <button
            key={single.id}
            type="button"
            onClick={() => onSelect(single.id)}
            aria-label={`${single.placeName}${selected ? " (selected)" : ""}`}
            aria-pressed={selected}
            className={cn(
              "absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-brand transition-transform hover:scale-125",
              selected && "size-5 bg-foreground ring-4 ring-brand/25",
            )}
            style={{ left: c.x, top: c.y }}
          />
        ) : (
          <button
            key={c.members.map((m) => m.id).join()}
            type="button"
            onClick={() => setView(viewFor(boundsOf(c.members), size.w / size.h))}
            aria-label={`${c.members.length} memories near ${c.members[0].placeName}. Zoom in`}
            className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-foreground text-[12px] font-semibold text-white"
            style={{ left: c.x, top: c.y }}
          >
            {c.members.length}
          </button>
        )
      })}

      {!compact && (
        <div className="glass absolute top-3 right-3 flex flex-col overflow-hidden rounded-full">
          <MapButton label="Zoom in" onClick={() => zoom(0.6)}><Plus className="size-4" /></MapButton>
          <MapButton label="Zoom out" onClick={() => zoom(1.6)}><Minus className="size-4" /></MapButton>
          <MapButton label="Show all memories" onClick={() => setView(null)}><RotateCcw className="size-3.5" /></MapButton>
        </div>
      )}
      {!compact && (
        <p className="glass absolute top-3 right-14 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
          title="Add a Mapbox token for streets and terrain.">
          Simplified map
        </p>
      )}
    </div>
  )
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-8 items-center justify-center hover:bg-black/[0.05]">
      {children}
    </button>
  )
}
