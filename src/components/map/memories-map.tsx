"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { MapPinOff, X } from "lucide-react"
import type { Memory } from "@/lib/types"
import { config } from "@/lib/config"
import { hasLocation } from "@/lib/geo"
import { formatDate, plural } from "@/lib/format"
import { MemoryPhoto } from "@/components/memory-photo"
import { FallbackMap } from "./fallback-map"
import { cn } from "@/lib/utils"

const MapboxMap = dynamic(() => import("./mapbox-map").then((m) => m.MapboxMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" role="status" aria-label="Loading map" />,
})

type Props = {
  memories: Memory[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Small, non-interactive preview with no popup. */
  compact?: boolean
  /** Show the preview card for the selected pin. */
  showPreview?: boolean
  className?: string
  /** Extra classes for the preview card, e.g. to clear a floating panel. */
  previewClassName?: string
  /** Pixels on the left covered by floating UI, so pins are fitted beside it. */
  insetLeft?: number
}

export function MemoriesMap({ memories, selectedId: controlled, onSelect, compact, showPreview = !compact, className, previewClassName, insetLeft = 0 }: Props) {
  const [internal, setInternal] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const selectedId = controlled !== undefined ? controlled : internal
  const select = (id: string | null) => (onSelect ? onSelect(id) : setInternal(id))

  const located = useMemo(() => memories.filter(hasLocation), [memories])
  const unlocated = memories.length - located.length
  const selected = located.find((m) => m.id === selectedId) ?? null

  let body: React.ReactNode
  if (memories.length === 0) {
    body = (
      <div className="flex size-full flex-col items-center justify-center gap-1 bg-[#eceff2] p-4 text-center">
        <MapPinOff className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-[13px] font-semibold">No places to show yet</p>
        {!compact && <p className="text-[12px] text-muted-foreground">Memories you add will appear here as pins.</p>}
      </div>
    )
  } else if (located.length === 0) {
    body = (
      <div className="flex size-full flex-col items-center justify-center gap-1 bg-[#eceff2] p-4 text-center">
        <MapPinOff className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-[13px] font-semibold">None of these memories have a map location</p>
        {!compact && <p className="text-[12px] text-muted-foreground">Edit a memory and search for its place to pin it.</p>}
      </div>
    )
  } else if (config.hasMapbox && !mapError) {
    body = <MapboxMap memories={located} selectedId={selectedId} onSelect={select} onError={setMapError} compact={compact} insetLeft={insetLeft} />
  } else {
    body = <FallbackMap memories={located} selectedId={selectedId} onSelect={select} compact={compact} insetLeft={insetLeft} />
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {body}
      {mapError && !compact && (
        <p role="status" className="glass absolute top-14 left-3 max-w-[70%] rounded-2xl px-3 py-1.5 text-[12px] text-muted-foreground">
          The full map couldn&apos;t load ({mapError}). Showing a simplified map instead.
        </p>
      )}
      {!compact && unlocated > 0 && located.length > 0 && (
        <p className="glass absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {plural(unlocated, "memory", "memories")} without a location
        </p>
      )}
      {showPreview && selected && <MapPreviewCard memory={selected} onClose={() => select(null)} className={previewClassName} />}
    </div>
  )
}

export function MapPreviewCard({ memory, onClose, className }: { memory: Memory; onClose: () => void; className?: string }) {
  return (
    <div
      className={cn("glass-strong animate-rise absolute inset-x-3 bottom-3 z-10 flex gap-3 rounded-[22px] p-2 sm:right-auto sm:w-[330px]", className)}
      role="dialog"
      aria-label={`Preview of ${memory.placeName}`}
    >
      <MemoryPhoto path={memory.photoPath} alt={memory.placeName} className="size-[76px] shrink-0 rounded-[15px]" />
      <div className="min-w-0 flex-1 py-1 pr-7">
        <p className="truncate text-[14px] font-semibold">{memory.placeName}</p>
        <p className="text-[12px] text-muted-foreground">{formatDate(memory.visitedOn, "short")}</p>
        <Link href={`/memories/${memory.id}`} className="mt-2 inline-flex h-7 items-center rounded-full bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/85">
          Open memory
        </Link>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-black/[0.05]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
