"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CircleCheck, Pencil, Trash2 } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { BackLink, NotFoundState, PageContainer } from "@/components/page"
import { MemoryPhoto } from "@/components/memory-photo"
import { TagList } from "@/components/memory-card"
import { MemoriesMap } from "@/components/map/memories-map"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { seedPhotoCredits } from "@/lib/data/seed"
import { cn } from "@/lib/utils"

function Row({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
      </dt>
      <dd className="min-w-0 text-right text-[13px] font-medium">{children}</dd>
    </div>
  )
}

export function MemoryDetail() {
  const { id } = useParams<{ id: string }>()
  const justSaved = useSearchParams().get("saved") === "1"
  const router = useRouter()
  const { getMemory, getTrip, trips, deleteMemory, moveMemories } = useData()
  const [confirming, setConfirming] = useState(false)
  const [moving, setMoving] = useState(false)
  const memory = getMemory(id)

  if (!memory) return <NotFoundState title="We couldn't find that memory" backHref="/journal" backLabel="Back to your journal" />

  const trip = memory.tripId ? getTrip(memory.tripId) : undefined

  const changeTrip = async (tripId: string | null) => {
    setMoving(true)
    try {
      await moveMemories([memory.id], tripId)
      toast.success(tripId ? `Moved to ${getTrip(tripId)?.name}` : "Removed from the trip")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setMoving(false)
    }
  }

  return (
    <PageContainer className="max-w-5xl">
      <BackLink href={trip ? `/trips/${trip.id}` : "/journal"}>{trip ? trip.name : "Journal"}</BackLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="relative min-w-0">
          <MemoryPhoto
            path={memory.photoPath}
            alt={memory.placeName}
            fallbackLabel="No photo yet. Add one from Edit."
            className={cn("aspect-[4/3] w-full rounded-[26px]", justSaved && "animate-saved")}
          />
          {memory.photoPath && seedPhotoCredits[memory.photoPath] && (
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              Sample photo by{" "}
              <a href={seedPhotoCredits[memory.photoPath].source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {seedPhotoCredits[memory.photoPath].author}
              </a>
              , {seedPhotoCredits[memory.photoPath].license}, via Wikimedia Commons
            </p>
          )}
          {justSaved && (
            <p role="status" className="glass-strong animate-rise absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold">
              <CircleCheck className="size-4 text-brand" aria-hidden /> Saved to your journal
            </p>
          )}
        </div>

        <article className="min-w-0">
          <h1 className="text-[34px] leading-[1.05] sm:text-[40px]">{memory.placeName}</h1>
          {memory.address && <p className="mt-2 text-[13px] text-muted-foreground">{memory.address}</p>}

          {memory.note ? (
            <p className="mt-5 font-heading text-[19px] leading-[1.45] whitespace-pre-line text-foreground/90">{memory.note}</p>
          ) : (
            <p className="mt-5 text-[13px] text-muted-foreground">
              No note yet.{" "}
              <Link href={`/memories/${memory.id}/edit`} className="font-semibold text-brand hover:underline">Add a few words</Link>
            </p>
          )}

          <TagList tags={memory.tags} className="mt-4" />

          <dl className="surface mt-6 divide-y divide-hairline overflow-hidden rounded-2xl">
            <Row label="Visited">
              <time dateTime={memory.visitedOn}>{formatDate(memory.visitedOn)}</time>
            </Row>
            <Row label="Trip" htmlFor="move-trip">
              <select
                id="move-trip"
                value={memory.tripId ?? ""}
                disabled={moving}
                onChange={(e) => changeTrip(e.target.value || null)}
                className="max-w-[200px] cursor-pointer truncate rounded-lg bg-transparent py-1 text-right text-[13px] font-medium text-brand outline-none"
              >
                <option value="">None</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Row>
          </dl>

          <div className="mt-5 flex gap-2">
            <Link href={`/memories/${memory.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}>
              <Pencil data-icon="inline-start" /> Edit
            </Link>
            <Button variant="ghost" className="h-9 px-4 text-destructive hover:bg-destructive/8 hover:text-destructive" onClick={() => setConfirming(true)}>
              <Trash2 data-icon="inline-start" /> Delete
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px]">
            <MemoriesMap memories={[memory]} selectedId={memory.id} onSelect={() => {}} showPreview={false} className="h-56" />
          </div>
        </article>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this memory?"
        description={`“${memory.placeName}” and its photo will be removed from your journal. You can undo for a few seconds afterwards.`}
        confirmLabel="Delete memory"
        destructive
        onConfirm={() => {
          deleteMemory(memory.id)
          router.push(trip ? `/trips/${trip.id}` : "/journal")
        }}
      />
    </PageContainer>
  )
}
