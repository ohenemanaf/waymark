"use client"

import { useId, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ChevronDown, Info, Loader2, MapPinCheck, X } from "lucide-react"
import type { Memory, MemoryInput, PhotoChange } from "@/lib/types"
import { memoryFormSchema, type MemoryFormValues } from "@/lib/schema"
import { config } from "@/lib/config"
import { reversePlace } from "@/lib/mapbox"
import { todayISO } from "@/lib/format"
import { allTags } from "@/lib/filters"
import { PhotoUploadError } from "@/lib/data/repository"
import { useData } from "@/components/providers/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/field-error"
import { PlaceSearch } from "./place-search"
import { CurrentLocationButton } from "./use-current-location"
import { PhotoField, type PhotoValue } from "./photo-field"
import { TagInput } from "./tag-input"
import { cn } from "@/lib/utils"

const optional = <span className="font-normal text-muted-foreground">(optional)</span>

export function MemoryForm({ memory, defaultTripId }: { memory?: Memory; defaultTripId?: string | null }) {
  const router = useRouter()
  const { createMemory, updateMemory, memories, trips } = useData()
  const editing = Boolean(memory)
  // Unique per form instance: Next keeps visited pages mounted (hidden), so the add and edit
  // forms can exist together and fixed ids would make labels point at the hidden copy.
  const uid = useId()
  const fid = (name: string) => `${uid}-${name}`

  const form = useForm<MemoryFormValues>({
    resolver: zodResolver(memoryFormSchema),
    defaultValues: {
      placeName: memory?.placeName ?? "",
      address: memory?.address ?? "",
      latitude: memory?.latitude ?? null,
      longitude: memory?.longitude ?? null,
      visitedOn: memory?.visitedOn ?? todayISO(),
      note: memory?.note ?? "",
      tags: memory?.tags ?? [],
      tripId: memory?.tripId ?? defaultTripId ?? null,
    },
  })
  const { register, handleSubmit, setValue, control, formState, setFocus } = form
  const { errors, isSubmitting } = formState

  const [photo, setPhoto] = useState<PhotoValue>({ file: null, removed: false })
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [uploadFailed, setUploadFailed] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [placeHint, setPlaceHint] = useState<string | null>(null)
  const [showCoords, setShowCoords] = useState(false)
  const [showMore, setShowMore] = useState(editing)

  const [lat, lng, placeName] = useWatch({ control, name: ["latitude", "longitude", "placeName"] })
  const knownTags = useMemo(() => allTags(memories), [memories])

  const setPlace = (p: { name: string; address: string | null; latitude: number; longitude: number }) => {
    setValue("placeName", p.name, { shouldValidate: true, shouldDirty: true })
    setValue("address", p.address ?? "", { shouldDirty: true })
    setValue("latitude", p.latitude, { shouldDirty: true })
    setValue("longitude", p.longitude, { shouldDirty: true })
    setPlaceHint(null)
  }

  const save = async (values: MemoryFormValues, skipPhoto = false) => {
    setSubmitError(null)
    setPhotoError(null)
    setUploadFailed(false)
    const input: MemoryInput = {
      placeName: values.placeName,
      address: values.address || null,
      latitude: values.latitude,
      longitude: values.longitude,
      visitedOn: values.visitedOn,
      note: values.note || null,
      tags: values.tags,
      tripId: values.tripId,
    }
    const file = skipPhoto ? null : photo.file
    const onProgress = (n: number) => setProgress(n)
    try {
      if (file) setProgress(0)
      let saved: Memory
      if (memory) {
        const change: PhotoChange = file ? { kind: "replace", file } : photo.removed ? { kind: "remove" } : { kind: "keep" }
        saved = await updateMemory(memory.id, input, change, onProgress)
        toast.success("Changes saved")
      } else {
        saved = await createMemory(input, file, onProgress)
        toast.success(`Saved “${saved.placeName}” to your journal`)
      }
      router.push(`/memories/${saved.id}?saved=1`)
    } catch (e) {
      if (e instanceof PhotoUploadError) {
        setPhotoError(`${e.message} Your other details are still here.`)
        setUploadFailed(true)
      } else {
        setSubmitError((e as Error).message || "Something went wrong while saving. Please try again.")
      }
    } finally {
      setProgress(null)
    }
  }

  const onSubmit = handleSubmit((v) => save(v))
  const busy = isSubmitting || progress !== null

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={busy}>
      {/* Place */}
      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-[15px] font-semibold">Where were you?</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {config.hasMapbox && (
            <div className="flex-1">
              <PlaceSearch onPick={setPlace} />
            </div>
          )}
          <CurrentLocationButton
            onError={(m) => setPlaceHint(m)}
            onLocated={async ({ latitude, longitude }) => {
              const found = await reversePlace(latitude, longitude).catch(() => null)
              if (found) setPlace({ ...found, latitude, longitude })
              else {
                setValue("latitude", latitude, { shouldDirty: true })
                setValue("longitude", longitude, { shouldDirty: true })
                setPlaceHint("We've pinned your location. Add a name for this place below.")
                setFocus("placeName")
              }
            }}
          />
        </div>
        {!config.hasMapbox && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            Place search isn&apos;t set up here, so type the place name. You can still use your location to pin it.
          </p>
        )}
        {placeHint && (
          <p role="status" className="rounded-2xl bg-black/[0.04] px-3.5 py-2.5 text-[12px] text-foreground/80">
            {placeHint}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={fid("placeName")}>Place name</Label>
          <Input
            id={fid("placeName")}
            placeholder="e.g. Belém Tower, Grandma's garden"
            className="h-10"
            aria-invalid={!!errors.placeName}
            aria-describedby={errors.placeName ? fid("placeName-error") : undefined}
            {...register("placeName")}
          />
          <FieldError id={fid("placeName-error")} message={errors.placeName?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={fid("address")}>Address or area {optional}</Label>
          <Input id={fid("address")} aria-invalid={!!errors.address} aria-describedby={errors.address ? fid("address-error") : undefined} {...register("address")} />
          <FieldError id={fid("address-error")} message={errors.address?.message} />
        </div>

        {lat !== null && lng !== null && !showCoords ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-soft px-3.5 py-2.5 text-[12px]">
            <span className="flex items-center gap-1.5 font-medium text-brand">
              <MapPinCheck className="size-4" aria-hidden /> Pinned on the map at {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
            <span className="flex gap-1">
              <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setShowCoords(true)}>Edit</button>
              <span aria-hidden>·</span>
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() => {
                  setValue("latitude", null, { shouldDirty: true })
                  setValue("longitude", null, { shouldDirty: true })
                }}
              >
                Remove pin
              </button>
            </span>
          </div>
        ) : !showCoords ? (
          <button type="button" onClick={() => setShowCoords(true)} className="text-[12px] font-semibold text-brand hover:underline">
            Enter coordinates manually
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(["latitude", "longitude"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={fid(k)} className="text-xs capitalize">{k}</Label>
                <Input
                  id={fid(k)}
                  inputMode="decimal"
                  placeholder={k === "latitude" ? "38.7223" : "-9.1393"}
                  aria-invalid={!!errors[k]}
                  aria-describedby={errors[k] ? fid(`${k}-error`) : undefined}
                  {...register(k, { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
                />
                <FieldError id={fid(`${k}-error`)} message={errors[k]?.message} />
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <PhotoField
        value={photo}
        onChange={(v) => {
          setPhoto(v)
          setUploadFailed(false)
        }}
        existingPath={memory?.photoPath ?? null}
        placeName={placeName}
        progress={progress}
        error={photoError}
        onError={setPhotoError}
      />
      {uploadFailed && (
        <div className="-mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onSubmit()}>Try the upload again</Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleSubmit((v) => save(v, true))}>
            Save without the photo
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={fid("note")}>A few words {optional}</Label>
        <Textarea
          id={fid("note")}
          rows={3}
          placeholder="What do you want to remember about it?"
          aria-invalid={!!errors.note}
          aria-describedby={errors.note ? fid("note-error") : undefined}
          {...register("note")}
        />
        <FieldError id={fid("note-error")} message={errors.note?.message} />
      </div>

      <div className="space-y-1.5 sm:max-w-[220px]">
        <Label htmlFor={fid("visitedOn")}>Visited on</Label>
        <Input
          id={fid("visitedOn")}
          type="date"
          max={todayISO()}
          aria-invalid={!!errors.visitedOn}
          aria-describedby={errors.visitedOn ? fid("visitedOn-error") : undefined}
          {...register("visitedOn")}
        />
        <FieldError id={fid("visitedOn-error")} message={errors.visitedOn?.message} />
      </div>

      <div className="surface overflow-hidden rounded-2xl">
        <button
          type="button"
          aria-expanded={showMore}
          aria-controls={fid("more-details")}
          onClick={() => setShowMore((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-semibold hover:bg-black/[0.02]"
        >
          Tags and trip {optional}
          <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} aria-hidden />
        </button>
        {showMore && (
          <div id={fid("more-details")} className="space-y-5 border-t border-hairline px-4 pt-4 pb-5">
            <div className="space-y-1.5">
              <span className="text-sm font-medium" id={fid("tags-label")}>Tags</span>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} known={knownTags} describedBy={errors.tags ? fid("tags-error") : fid("tags-label")} />
                )}
              />
              <FieldError id={fid("tags-error")} message={errors.tags?.message ?? errors.tags?.[0]?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={fid("tripId")}>Trip</Label>
              <Controller
                control={control}
                name="tripId"
                render={({ field }) => (
                  <select
                    id={fid("tripId")}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="h-9 w-full rounded-xl border border-input bg-card px-3 text-[14px] sm:max-w-xs"
                  >
                    <option value="">Not part of a trip</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        )}
      </div>

      {submitError && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
          <X className="mt-0.5 size-4 shrink-0" aria-hidden /> {submitError}
        </p>
      )}

      {/* Sticky on mobile so saving is always one thumb away */}
      <div className="glass sticky bottom-[84px] z-10 -mx-1 flex gap-2 rounded-full p-1.5 sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <Button type="submit" className="h-10 flex-1 sm:flex-none sm:px-7" disabled={busy}>
          {busy && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          {busy ? (progress !== null ? "Uploading…" : "Saving…") : editing ? "Save changes" : "Save memory"}
        </Button>
        <Button type="button" variant="ghost" className="h-10 px-5" onClick={() => router.back()} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
