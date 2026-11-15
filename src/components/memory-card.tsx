"use client"

import Link from "next/link"
import type { Memory } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { MemoryPhoto } from "@/components/memory-photo"
import { cn } from "@/lib/utils"

export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Tags">
      {tags.map((t) => (
        <li key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/70">
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Photo-forward tile for the grid view: the caption floats on glass over the photo. */
export function MemoryTile({ memory }: { memory: Memory }) {
  return (
    <Link href={`/memories/${memory.id}`} className="group relative block overflow-hidden rounded-[18px] bg-muted">
      <MemoryPhoto
        path={memory.photoPath}
        alt={memory.placeName}
        fallbackLabel="No photo"
        className="aspect-[4/5] w-full transition-transform duration-700 ease-out-soft group-hover:scale-[1.02]"
      />
      <div className="glass-dark absolute inset-x-1.5 bottom-1.5 rounded-[13px] px-2.5 py-1.5">
        <p className="truncate text-[13px] font-semibold">{memory.placeName}</p>
        <p className="text-[11px] text-white/80">{formatDate(memory.visitedOn, "short")}</p>
      </div>
    </Link>
  )
}

/** A row in the chronological journal. */
export function MemoryEntry({ memory }: { memory: Memory }) {
  return (
    <Link href={`/memories/${memory.id}`} className="group flex gap-3.5 px-3 py-3 transition-colors hover:bg-black/[0.02] sm:gap-4">
      <MemoryPhoto path={memory.photoPath} alt={memory.placeName} className="size-[72px] shrink-0 rounded-xl sm:h-[84px] sm:w-[112px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-[15px] group-hover:text-brand">{memory.placeName}</h3>
          <time dateTime={memory.visitedOn} className="shrink-0 text-[12px] text-muted-foreground">
            {formatDate(memory.visitedOn, "short")}
          </time>
        </div>
        {memory.note ? (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{memory.note}</p>
        ) : memory.address ? (
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{memory.address}</p>
        ) : null}
        <TagList tags={memory.tags.slice(0, 4)} className="mt-2" />
      </div>
    </Link>
  )
}
