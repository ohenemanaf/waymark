import type { Metadata } from "next"
import { Suspense } from "react"
import { NewMemory } from "./new-memory"

export const metadata: Metadata = { title: "Add a memory" }

export default function NewMemoryPage() {
  return (
    <Suspense fallback={null}>
      <NewMemory />
    </Suspense>
  )
}
