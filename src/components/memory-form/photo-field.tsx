"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react"
import { MemoryPhoto } from "@/components/memory-photo"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/field-error"
import { validatePhoto } from "@/lib/photos"
import { cn } from "@/lib/utils"

export type PhotoValue = { file: File | null; removed: boolean }

type Props = {
  value: PhotoValue
  onChange: (v: PhotoValue) => void
  existingPath: string | null
  placeName: string
  progress: number | null
  error: string | null
  onError: (message: string | null) => void
}

export function PhotoField({ value, onChange, existingPath, placeName, progress, error, onError }: Props) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!value.file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preview URL tracks the chosen file
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value.file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value.file])

  const accept = (file: File | undefined) => {
    if (!file) return
    const problem = validatePhoto(file)
    if (problem) {
      onError(problem)
      return
    }
    onError(null)
    onChange({ file, removed: false })
  }

  const showingExisting = !value.file && !value.removed && existingPath
  const hasPhoto = Boolean(value.file || showingExisting)
  const uploading = progress !== null

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span id={`${id}-label`} className="text-[15px] font-semibold">Photo</span>
        <span className="text-[12px] text-muted-foreground">JPG, PNG, WebP or HEIC, up to 15 MB</span>
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          accept(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      {hasPhoto ? (
        <div className="relative overflow-hidden rounded-[22px] bg-muted">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`Selected photo for ${placeName || "this memory"}`} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <MemoryPhoto path={existingPath} alt={placeName || "This memory"} className="aspect-[4/3] w-full" />
          )}
          {uploading && (
            <div className="glass-strong absolute inset-x-2 bottom-2 rounded-2xl p-3">
              <div className="mb-1.5 flex justify-between text-[12px] font-medium">
                <span>Uploading photo…</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Photo upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="h-1 overflow-hidden rounded-full bg-black/[0.08]"
              >
                <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Button type="button" size="sm" variant="outline" className="px-3" onClick={() => input.current?.click()}>
                <RefreshCw data-icon="inline-start" /> Replace
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className=""
                aria-label="Remove photo"
                onClick={() => {
                  onError(null)
                  onChange({ file: null, removed: true })
                }}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            accept(e.dataTransfer.files?.[0])
          }}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-black/[0.14] bg-card text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground sm:aspect-[2/1]",
            dragging && "border-brand bg-brand-soft",
            error && "border-destructive/60",
          )}
        >
          <span className="flex gap-2">
            <Camera className="size-5" aria-hidden />
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="text-[14px] font-semibold text-foreground">Add a photo</span>
          <span className="text-[12px]">Take one, or choose from your library</span>
        </button>
      )}
      <FieldError id={`${id}-error`} message={error ?? undefined} />
    </div>
  )
}
