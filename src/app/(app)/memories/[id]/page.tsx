import type { Metadata } from "next"
import { Suspense } from "react"
import { MemoryDetail } from "./memory-detail"

export const metadata: Metadata = { title: "Memory" }

export default function MemoryPage() {
  return (
    <Suspense fallback={null}>
      <MemoryDetail />
    </Suspense>
  )
}
