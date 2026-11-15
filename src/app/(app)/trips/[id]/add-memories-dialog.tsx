"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Trip } from "@/lib/types"
import { useData } from "@/components/providers/data-provider"
import { MemoryPhoto } from "@/components/memory-photo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDate, plural } from "@/lib/format"

export function AddMemoriesDialog({ open, onOpenChange, trip }: { open: boolean; onOpenChange: (o: boolean) => void; trip: Trip }) {
  const { memories, trips, moveMemories } = useData()
  const [chosen, setChosen] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const candidates = memories.filter((m) => m.tripId !== trip.id)
  const tripName = (id: string | null) => (id ? trips.find((t) => t.id === id)?.name : null)

  const close = (o: boolean) => {
    if (!o) setChosen([])
    onOpenChange(o)
  }

  const submit = async () => {
    setBusy(true)
    try {
      await moveMemories(chosen, trip.id)
      toast.success(`Moved ${plural(chosen.length, "memory", "memories")} to ${trip.name}`)
      close(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move memories to {trip.name}</DialogTitle>
          <DialogDescription>Memories already in another trip will move out of it.</DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every memory is already in this trip.</p>
        ) : (
          <fieldset className="-mx-1 max-h-[50dvh] overflow-y-auto">
            <legend className="sr-only">Choose memories</legend>
            {candidates.map((m) => {
              const on = chosen.includes(m.id)
              const current = tripName(m.tripId)
              return (
                <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 hover:bg-black/[0.04]">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setChosen((c) => (on ? c.filter((x) => x !== m.id) : [...c, m.id]))}
                    className="size-4 accent-[var(--lagoon)]"
                  />
                  <MemoryPhoto path={m.photoPath} alt="" className="size-10 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.placeName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatDate(m.visitedOn, "short")}
                      {current ? `, in ${current}` : ""}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!chosen.length || busy}>
            {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Move {chosen.length ? plural(chosen.length, "memory", "memories") : "memories"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
