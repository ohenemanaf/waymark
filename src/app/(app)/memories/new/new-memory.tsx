"use client"

import { useSearchParams } from "next/navigation"
import { MemoryForm } from "@/components/memory-form/memory-form"
import { BackLink, PageContainer, PageTitle } from "@/components/page"
import { useData } from "@/components/providers/data-provider"

export function NewMemory() {
  const params = useSearchParams()
  const { getTrip } = useData()
  const trip = getTrip(params.get("trip") ?? "")
  return (
    <PageContainer className="max-w-xl">
      <BackLink href={trip ? `/trips/${trip.id}` : "/journal"}>{trip ? trip.name : "Journal"}</BackLink>
      <PageTitle subtitle="A place and a photo is enough. Everything else can wait." className="mb-8">
        Add a memory
      </PageTitle>
      <MemoryForm defaultTripId={trip?.id ?? null} />
    </PageContainer>
  )
}
