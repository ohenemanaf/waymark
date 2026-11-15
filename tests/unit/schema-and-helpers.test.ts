import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { authSchema, memoryFormSchema, normaliseTag, tripFormSchema } from "@/lib/schema"
import { approximate, boundsOf, distanceKm, hasLocation } from "@/lib/geo"
import { formatRange, plural } from "@/lib/format"

const valid = {
  placeName: "Belém Tower",
  address: "",
  latitude: 38.6916,
  longitude: -9.216,
  visitedOn: "2026-04-19",
  note: "",
  tags: ["food"],
  tripId: null,
}

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`)

describe("memoryFormSchema", () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date("2026-11-15T12:00:00") }))
  afterEach(() => vi.useRealTimers())

  it("accepts a memory with only a place and date", () => {
    expect(memoryFormSchema.safeParse({ ...valid, latitude: null, longitude: null, tags: [] }).success).toBe(true)
  })

  it("requires a place name and explains how to add one", () => {
    expect(issues(memoryFormSchema.safeParse({ ...valid, placeName: "   " }))[0]).toMatch(/^placeName: Add a place/)
  })

  it("rejects future visit dates", () => {
    expect(issues(memoryFormSchema.safeParse({ ...valid, visitedOn: "2026-11-16" }))).toEqual([
      "visitedOn: The visit date can't be in the future",
    ])
  })

  it("needs both coordinates or neither, within range", () => {
    expect(issues(memoryFormSchema.safeParse({ ...valid, longitude: null }))).toContain(
      "longitude: Add both latitude and longitude, or leave both empty",
    )
    expect(issues(memoryFormSchema.safeParse({ ...valid, latitude: 91 }))[0]).toMatch(/^latitude: Latitude must be between/)
  })

  it("limits tags to ten", () => {
    expect(memoryFormSchema.safeParse({ ...valid, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false)
  })
})

describe("other schemas", () => {
  it("rejects a trip that ends before it starts", () => {
    expect(issues(tripFormSchema.safeParse({ name: "Lisbon", startDate: "2026-04-20", endDate: "2026-04-17" }))).toEqual([
      "endDate: The end date must be on or after the start date",
    ])
  })

  it("validates sign-in details", () => {
    expect(authSchema.safeParse({ email: "ama@example.com", password: "long-enough" }).success).toBe(true)
    expect(authSchema.safeParse({ email: "not-an-email", password: "short" }).success).toBe(false)
  })

  it("normalises tags", () => {
    expect(normaliseTag("  #Day Trip ")).toBe("day-trip")
  })
})

describe("geo helpers", () => {
  it("measures distance in kilometres", () => {
    // Accra to Cape Coast is about 130 km in a straight line.
    expect(distanceKm({ latitude: 5.6037, longitude: -0.187 }, { latitude: 5.1036, longitude: -1.2414 })).toBeCloseTo(129, -1)
  })

  it("computes bounds and detects missing locations", () => {
    expect(boundsOf([])).toBeNull()
    expect(boundsOf([{ latitude: 1, longitude: 2 }, { latitude: -3, longitude: 4 }])).toEqual({ west: 2, east: 4, south: -3, north: 1 })
    expect(hasLocation({ latitude: null, longitude: 1 })).toBe(false)
  })

  it("rounds to about a kilometre for approximate locations", () => {
    expect(approximate(38.69163)).toBe(38.69)
    expect(approximate(null)).toBeNull()
  })
})

describe("format helpers", () => {
  it("formats date ranges compactly", () => {
    expect(formatRange("2026-04-17", "2026-04-20")).toBe("17–20 Apr 2026")
    expect(formatRange("2025-10-30", "2025-11-02")).toBe("30 Oct – 2 Nov 2025")
    expect(formatRange("2025-12-30", "2026-01-02")).toBe("30 Dec 2025 – 2 Jan 2026")
    expect(formatRange(null, null)).toBe("No dates yet")
  })

  it("pluralises", () => {
    expect(plural(1, "memory", "memories")).toBe("1 memory")
    expect(plural(3, "memory", "memories")).toBe("3 memories")
  })
})
