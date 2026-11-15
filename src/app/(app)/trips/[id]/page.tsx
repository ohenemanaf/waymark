import type { Metadata } from "next"
import { Suspense } from "react"
import { TripDetail } from "./trip-detail"

export const metadata: Metadata = { title: "Trip" }

export default function TripPage() {
  return (
    <Suspense fallback={null}>
      <TripDetail />
    </Suspense>
  )
}
