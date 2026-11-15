import type { Metadata } from "next"
import { Suspense } from "react"
import { JournalHome } from "./journal-home"

export const metadata: Metadata = { title: "Journal" }

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalHome />
    </Suspense>
  )
}
