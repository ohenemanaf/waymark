import type { Metadata } from "next"
import { TripsScreen } from "./trips-screen"

export const metadata: Metadata = { title: "Trips" }

export default function TripsPage() {
  return <TripsScreen />
}
