import { describe, expect, it } from "vitest"
import { suggestTrips, tripCoverPath, tripRange } from "@/lib/trips"
import type { Memory, Trip } from "@/lib/types"

const memory = (id: string, visitedOn: string, lat: number | null, lng: number | null, over: Partial<Memory> = {}): Memory => ({
  id,
  tripId: null,
  placeName: id,
  address: null,
  latitude: lat,
  longitude: lng,
  visitedOn,
  note: null,
  photoPath: null,
  tags: [],
  createdAt: "",
  updatedAt: "",
  ...over,
})

describe("suggestTrips", () => {
  it("groups memories within 3 days and 250 km of each other", () => {
    const s = suggestTrips([
      memory("cape-coast", "2026-08-22", 5.1036, -1.2414, { address: "Victoria Road, Cape Coast, Ghana" }),
      memory("kakum", "2026-08-23", 5.35, -1.383, { address: "Kakum National Park, Central Region, Ghana" }),
    ])
    expect(s).toHaveLength(1)
    expect(s[0]).toMatchObject({ name: "Cape Coast trip", startDate: "2026-08-22", endDate: "2026-08-23" })
    expect(s[0].memoryIds).toEqual(["cape-coast", "kakum"])
  })

  it("splits visits that are far apart in time or distance", () => {
    expect(suggestTrips([memory("a", "2026-01-01", 0, 0), memory("b", "2026-01-10", 0, 0)])).toEqual([])
    // Accra to Lisbon on consecutive days is not one trip.
    expect(suggestTrips([memory("a", "2026-01-01", 5.6, -0.19), memory("b", "2026-01-02", 38.7, -9.1)])).toEqual([])
  })

  it("ignores memories already in a trip, and dismissed suggestions", () => {
    const ms = [memory("a", "2026-01-01", 0, 0), memory("b", "2026-01-02", 0, 0)]
    expect(suggestTrips(ms.map((m) => ({ ...m, tripId: "t" })))).toEqual([])
    const [s] = suggestTrips(ms)
    expect(suggestTrips(ms, [s.key])).toEqual([])
  })

  it("still groups memories that have no coordinates", () => {
    expect(suggestTrips([memory("a", "2026-01-01", null, null), memory("b", "2026-01-02", 0, 0)])).toHaveLength(1)
  })
})

describe("trip dates and covers", () => {
  const trip: Trip = { id: "t", name: "T", startDate: null, endDate: null, coverPhotoPath: null, createdAt: "" }
  const ms = [
    memory("b", "2026-04-20", 0, 0, { tripId: "t", photoPath: "/b.jpg" }),
    memory("a", "2026-04-17", 0, 0, { tripId: "t", photoPath: "/a.jpg" }),
    memory("x", "2020-01-01", 0, 0, { photoPath: "/x.jpg" }),
  ]

  it("falls back to the trip's memory dates", () => {
    expect(tripRange(trip, ms)).toEqual({ start: "2026-04-17", end: "2026-04-20" })
    expect(tripRange({ ...trip, startDate: "2026-04-16" }, ms).start).toBe("2026-04-16")
  })

  it("uses the chosen cover, or the earliest photo when the cover is gone", () => {
    expect(tripCoverPath({ ...trip, coverPhotoPath: "/b.jpg" }, ms)).toBe("/b.jpg")
    expect(tripCoverPath({ ...trip, coverPhotoPath: "/deleted.jpg" }, ms)).toBe("/a.jpg")
    expect(tripCoverPath(trip, [])).toBeNull()
  })
})
