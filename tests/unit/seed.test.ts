import { existsSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { seedMemories, seedPhotoCredits, seedTrips } from "@/lib/data/seed"
import { memoryFormSchema } from "@/lib/schema"
import { suggestTrips } from "@/lib/trips"

describe("demo seed data", () => {
  beforeAll(() => vi.useFakeTimers({ now: new Date("2026-11-15T12:00:00") }))
  afterAll(() => vi.useRealTimers())

  it("has unique ids", () => {
    const ids = seedMemories.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("only points at trips that exist", () => {
    const tripIds = new Set(seedTrips.map((t) => t.id))
    for (const m of seedMemories) if (m.tripId) expect(tripIds.has(m.tripId), m.id).toBe(true)
  })

  it("passes the same validation as the add-memory form", () => {
    for (const m of seedMemories) {
      const r = memoryFormSchema.safeParse({ ...m, address: m.address ?? "", note: m.note ?? "" })
      expect(r.success, `${m.id}: ${JSON.stringify(r.error?.issues)}`).toBe(true)
    }
  })

  it("bundles and credits every photo it uses", () => {
    const paths = [...seedMemories.map((m) => m.photoPath), ...seedTrips.map((t) => t.coverPhotoPath)].filter(
      (p): p is string => Boolean(p),
    )
    for (const p of paths) {
      expect(existsSync(join(process.cwd(), "public", p)), `${p} exists`).toBe(true)
      expect(seedPhotoCredits[p], `${p} credited`).toBeDefined()
    }
  })

  it("keeps trip dates in line with their memories", () => {
    for (const t of seedTrips) {
      for (const m of seedMemories.filter((x) => x.tripId === t.id)) {
        expect(m.visitedOn >= t.startDate! && m.visitedOn <= t.endDate!, `${m.id} in ${t.id}`).toBe(true)
      }
    }
  })

  it("includes the states the demo is meant to show", () => {
    expect(seedMemories.some((m) => !m.photoPath)).toBe(true)
    expect(seedMemories.some((m) => !m.note)).toBe(true)
    expect(suggestTrips(seedMemories).map((s) => s.name)).toEqual(["Cape Coast trip"])
  })
})
