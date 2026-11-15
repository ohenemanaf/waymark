"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { FolderInput, ListPlus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import type { Memory } from "@/lib/types"
import { useData } from "@/components/providers/data-provider"
import { BackLink, NotFoundState, PageContainer } from "@/components/page"
import { MemoryPhoto } from "@/components/memory-photo"
import { MemoryEntry } from "@/components/memory-card"
import { MemoriesMap } from "@/components/map/memories-map"
import { TripDialog } from "@/components/trip-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { AddMemoriesDialog } from "./add-memories-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRange, plural } from "@/lib/format"
import { tripCoverPath, tripRange } from "@/lib/trips"
import { cn } from "@/lib/utils"

export function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getTrip, memories, deleteTrip } = useData()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const trip = getTrip(id)

  if (!trip) return <NotFoundState title="We couldn't find that trip" backHref="/trips" backLabel="Back to trips" />

  const entries = memories.filter((m) => m.tripId === trip.id).sort((a, b) => a.visitedOn.localeCompare(b.visitedOn))
  const range = tripRange(trip, memories)

  return (
    <PageContainer>
      <BackLink href="/trips">Trips</BackLink>

      <header className="relative overflow-hidden rounded-[28px] bg-muted">
        <MemoryPhoto path={tripCoverPath(trip, memories)} alt={`Cover of ${trip.name}`} className="h-48 w-full sm:h-64" />
        <div className="glass-dark absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-[20px] px-4 py-3">
          <h1 className="text-[30px] leading-none text-white sm:text-[36px]">{trip.name}</h1>
          <p className="mt-1.5 text-[13px] text-white/85">
            {formatRange(range.start, range.end)}, {plural(entries.length, "memory", "memories")}
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/memories/new?trip=${trip.id}`} className={cn(buttonVariants(), "h-9 px-4")}>
          <Plus data-icon="inline-start" /> Add a memory
        </Link>
        <Button variant="outline" className="h-9 px-4" onClick={() => setAdding(true)}>
          <ListPlus data-icon="inline-start" /> Move memories here
        </Button>
        <Button variant="outline" className="h-9 px-4" onClick={() => setEditing(true)}>
          <Pencil data-icon="inline-start" /> Edit trip
        </Button>
        <Button variant="ghost" className="h-9 px-4 text-destructive hover:bg-destructive/8 hover:text-destructive" onClick={() => setDeleting(true)}>
          <Trash2 data-icon="inline-start" /> Delete trip
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="entries">
          <h2 id="entries" className="mb-2.5 px-1 text-[15px]">Journal</h2>
          {entries.length === 0 ? (
            <div className="surface rounded-2xl p-6 text-center text-[13px] text-muted-foreground">
              No memories in this trip yet. Add a new one or move existing memories here.
            </div>
          ) : (
            <ol className="surface divide-y divide-hairline overflow-hidden rounded-2xl">
              {entries.map((m) => (
                <li key={m.id} className={cn("relative [&>a]:pr-12", selected === m.id && "bg-brand-soft/60")}>
                  <MemoryEntry memory={m} />
                  <MoveMenu memory={m} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="trip-map" className="lg:sticky lg:top-6 lg:self-start">
          <h2 id="trip-map" className="mb-2.5 px-1 text-[15px]">Places</h2>
          <div className="overflow-hidden rounded-[22px]">
            <MemoriesMap memories={entries} selectedId={selected} onSelect={setSelected} className="h-72 lg:h-[420px]" />
          </div>
        </section>
      </div>

      <TripDialog open={editing} onOpenChange={setEditing} trip={trip} />
      <AddMemoriesDialog open={adding} onOpenChange={setAdding} trip={trip} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${trip.name}”?`}
        description={`The trip will be removed. Its ${plural(entries.length, "memory", "memories")} stay in your journal, just not grouped.`}
        confirmLabel="Delete trip"
        destructive
        onConfirm={async () => {
          try {
            await deleteTrip(trip.id)
            toast.success("Trip deleted. Its memories are still in your journal.")
            router.push("/trips")
          } catch (e) {
            toast.error((e as Error).message)
          }
        }}
      />
    </PageContainer>
  )
}

function MoveMenu({ memory }: { memory: Memory }) {
  const { trips, moveMemories } = useData()
  const move = async (tripId: string | null) => {
    try {
      await moveMemories([memory.id], tripId)
      toast.success(tripId ? `Moved to ${trips.find((t) => t.id === tripId)?.name}` : "Removed from this trip")
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  const others = trips.filter((t) => t.id !== memory.tripId)
  return (
    <div className="absolute top-2.5 right-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Move ${memory.placeName}`} className="text-muted-foreground" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {others.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to trip</DropdownMenuLabel>
              {others.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => move(t.id)}>
                  <FolderInput /> {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          {others.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => move(null)}>Remove from this trip</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
