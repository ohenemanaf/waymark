"use client"

import { useParams } from "next/navigation"
import { MemoryForm } from "@/components/memory-form/memory-form"
import { BackLink, NotFoundState, PageContainer, PageTitle } from "@/components/page"
import { useData } from "@/components/providers/data-provider"

export function EditMemory() {
  const { id } = useParams<{ id: string }>()
  const memory = useData().getMemory(id)
  if (!memory) return <NotFoundState title="We couldn't find that memory" backHref="/journal" backLabel="Back to your journal" />
  return (
    <PageContainer className="max-w-xl">
      <BackLink href={`/memories/${memory.id}`}>{memory.placeName}</BackLink>
      <PageTitle className="mb-8">Edit memory</PageTitle>
      <MemoryForm key={memory.id} memory={memory} />
    </PageContainer>
  )
}
