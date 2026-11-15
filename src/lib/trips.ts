import { differenceInCalendarDays, parseISO } from "date-fns"
import type { Memory, Trip } from "./types"
import { distanceKm, hasLocation } from "./geo"

const MAX_GAP_DAYS = 3
const MAX_DISTANCE_KM = 250

export type TripSuggestion = {
  key: string
  name: string
  startDate: string
  endDate: string
  memoryIds: string[]
}

/**
 * Groups memories that aren't in a trip into suggested trips:
 * consecutive visits no more than 3 days apart and within 250 km of each other.
 */
export function suggestTrips(memories: Memory[], dismissed: string[] = []): TripSuggestion[] {
  const loose = memories
    .filter((m) => !m.tripId)
    .sort((a, b) => a.visitedOn.localeCompare(b.visitedOn))

  const groups: Memory[][] = []
  for (const m of loose) {
    const group = groups.at(-1)
    const prev = group?.at(-1)
    const closeInTime =
      prev && differenceInCalendarDays(parseISO(m.visitedOn), parseISO(prev.visitedOn)) <= MAX_GAP_DAYS
    const closeInSpace =
      prev && (!hasLocation(prev) || !hasLocation(m) || distanceKm(prev, m) <= MAX_DISTANCE_KM)
    if (group && closeInTime && closeInSpace) group.push(m)
    else groups.push([m])
  }

  return groups
    .filter((g) => g.length >= 2)
    .map((g) => {
      const key = g.map((m) => m.id).sort().join(",")
      return {
        key,
        name: suggestName(g),
        startDate: g[0].visitedOn,
        endDate: g.at(-1)!.visitedOn,
        memoryIds: g.map((m) => m.id),
      }
    })
    .filter((s) => !dismissed.includes(s.key))
}

function suggestName(group: Memory[]) {
  // Most common last component of the address ("Cape Coast, Ghana" → "Ghana" is too broad,
  // so prefer the second-to-last part when present).
  const counts = new Map<string, number>()
  for (const m of group) {
    const parts = (m.address ?? "").split(",").map((p) => p.trim()).filter(Boolean)
    const area = parts.length >= 2 ? parts.at(-2)! : parts[0] ?? m.placeName
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }
  const [area] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return `${area.replace(/\d+/g, "").trim() || group[0].placeName} trip`
}

/** The trip's displayed date range: stored dates, falling back to its memories. */
export function tripRange(trip: Trip, memories: Memory[]) {
  const dates = memories.filter((m) => m.tripId === trip.id).map((m) => m.visitedOn).sort()
  return {
    start: trip.startDate ?? dates[0] ?? null,
    end: trip.endDate ?? dates.at(-1) ?? null,
  }
}

export function tripCoverPath(trip: Trip, memories: Memory[]) {
  if (trip.coverPhotoPath && memories.some((m) => m.photoPath === trip.coverPhotoPath)) {
    return trip.coverPhotoPath
  }
  return (
    memories
      .filter((m) => m.tripId === trip.id && m.photoPath)
      .sort((a, b) => a.visitedOn.localeCompare(b.visitedOn))[0]?.photoPath ?? null
  )
}
