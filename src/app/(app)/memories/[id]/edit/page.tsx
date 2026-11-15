import type { Metadata } from "next"
import { Suspense } from "react"
import { EditMemory } from "./edit-memory"

export const metadata: Metadata = { title: "Edit memory" }

export default function EditMemoryPage() {
  return (
    <Suspense fallback={null}>
      <EditMemory />
    </Suspense>
  )
}
