import type { Metadata } from "next"
import { MapScreen } from "./map-screen"

export const metadata: Metadata = { title: "Map" }

export default function MapPage() {
  return <MapScreen />
}
