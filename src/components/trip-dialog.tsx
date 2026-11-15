"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"
import type { Trip } from "@/lib/types"
import { tripFormSchema, type TripFormValues } from "@/lib/schema"
import { tripCoverPath } from "@/lib/trips"
import { useData } from "@/components/providers/data-provider"
import { MemoryPhoto } from "@/components/memory-photo"
import { FieldError } from "@/components/field-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip?: Trip
  onCreated?: (trip: Trip) => void
}

export function TripDialog({ open, onOpenChange, trip, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <TripForm trip={trip} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  )
}

function TripForm({ trip, onDone, onCreated }: { trip?: Trip; onDone: () => void; onCreated?: (t: Trip) => void }) {
  const { createTrip, updateTrip, memories } = useData()
  const tripPhotos = trip ? memories.filter((m) => m.tripId === trip.id && m.photoPath) : []
  const [cover, setCover] = useState<string | null>(trip ? tripCoverPath(trip, memories) : null)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: { name: trip?.name ?? "", startDate: trip?.startDate ?? "", endDate: trip?.endDate ?? "" },
  })
  const { errors, isSubmitting } = formState

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    const input = { name: v.name, startDate: v.startDate || null, endDate: v.endDate || null, coverPhotoPath: cover }
    try {
      if (trip) {
        await updateTrip(trip.id, input)
        toast.success("Trip updated")
      } else {
        const t = await createTrip(input)
        toast.success(`Created “${t.name}”`)
        onCreated?.(t)
      }
      onDone()
    } catch (e) {
      setError((e as Error).message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{trip ? "Edit trip" : "New trip"}</DialogTitle>
        <DialogDescription>
          {trip ? "Rename it, adjust the dates or pick a cover." : "Give it a name. You can add memories next."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="trip-name">Name</Label>
        <Input id="trip-name" placeholder="e.g. Summer in Lisbon" aria-invalid={!!errors.name} aria-describedby={errors.name ? "trip-name-error" : undefined} {...register("name")} />
        <FieldError id="trip-name-error" message={errors.name?.message} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="trip-start">Start <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="trip-start" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trip-end">End <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="trip-end" type="date" aria-invalid={!!errors.endDate} aria-describedby={errors.endDate ? "trip-end-error" : undefined} {...register("endDate")} />
        </div>
        <div className="col-span-2">
          <FieldError id="trip-end-error" message={errors.endDate?.message} />
          {!errors.endDate && <p className="text-xs text-muted-foreground">Leave empty to use the dates of the trip&apos;s memories.</p>}
        </div>
      </div>

      {tripPhotos.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Cover photo</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {tripPhotos.map((m) => {
              const on = cover === m.photoPath
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Use photo of ${m.placeName} as cover`}
                  onClick={() => setCover(m.photoPath)}
                  className={cn("relative overflow-hidden rounded-xl", on && "ring-2 ring-brand ring-offset-2 ring-offset-white")}
                >
                  <MemoryPhoto path={m.photoPath} alt="" className="aspect-square w-full" />
                  {on && (
                    <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {trip ? "Save trip" : "Create trip"}
        </Button>
      </DialogFooter>
    </form>
  )
}
