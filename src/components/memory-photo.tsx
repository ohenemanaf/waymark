"use client"

import { useState } from "react"
import { ImageOff, MapPin } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { cn } from "@/lib/utils"

type Props = {
  path: string | null | undefined
  alt: string
  className?: string
  /** Shown when there is no photo at all. */
  fallbackLabel?: string
}

/** Displays a stored photo, resolving its path to a URL through the data provider. */
export function MemoryPhoto({ path, alt, className, fallbackLabel }: Props) {
  const { photoUrl } = useData()
  const url = photoUrl(path)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!path || (url && failedUrl === url)) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground", className)}
        role="img"
        aria-label={path ? `${alt} (photo unavailable)` : `${alt} (no photo)`}
      >
        {path ? <ImageOff className="size-[18px]" strokeWidth={1.6} aria-hidden /> : <MapPin className="size-[18px]" strokeWidth={1.6} aria-hidden />}
        {fallbackLabel && <span className="px-2 text-center text-[12px]">{fallbackLabel}</span>}
      </div>
    )
  }

  if (!url) return <div className={cn("animate-pulse bg-muted", className)} aria-label={`Loading photo of ${alt}`} role="img" />

  return (
    // Signed and object URLs change per session, so next/image optimisation doesn't apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={cn("object-cover", className)} loading="lazy" onError={() => setFailedUrl(url)} />
  )
}
