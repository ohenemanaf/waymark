import { describe, expect, it } from "vitest"
import { allTags, applyFilters, emptyFilters, filtersFromParams, filtersToParams, isFiltering, sortByVisit } from "@/lib/filters"
import type { Memory, Trip } from "@/lib/types"

const memory = (over: Partial<Memory>): Memory => ({
  id: "m",
  tripId: null,
  placeName: "Somewhere",
  address: null,
  latitude: null,
  longitude: null,
  visitedOn: "2026-01-01",
  note: null,
  photoPath: null,
  tags: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
})

const trips: Trip[] = [{ id: "t1", name: "Kyoto in autumn", startDate: null, endDate: null, coverPhotoPath: null, createdAt: "" }]
const memories = [
  memory({ id: "a", placeName: "Nishiki Market", tripId: "t1", visitedOn: "2025-11-12", tags: ["food", "market"] }),
  memory({ id: "b", placeName: "Belém Tower", note: "Pastéis de nata on the steps", visitedOn: "2026-04-19", tags: ["food"] }),
  memory({ id: "c", placeName: "Fairy Pools", address: "Glenbrittle, Isle of Skye", visitedOn: "2025-07-03", tags: ["hike"] }),
]

describe("applyFilters", () => {
  it("returns everything when no filters are set", () => {
    expect(applyFilters(memories, trips, emptyFilters)).toHaveLength(3)
  })

  it("searches place names, notes, addresses and trip names, ignoring case", () => {
    const q = (text: string) => applyFilters(memories, trips, { ...emptyFilters, q: text }).map((m) => m.id)
    expect(q("NISHIKI")).toEqual(["a"])
    expect(q("pastéis")).toEqual(["b"])
    expect(q("skye")).toEqual(["c"])
    expect(q("kyoto")).toEqual(["a"])
  })

  it("filters by an inclusive date range", () => {
    const r = applyFilters(memories, trips, { ...emptyFilters, from: "2025-07-03", to: "2025-11-12" })
    expect(r.map((m) => m.id).sort()).toEqual(["a", "c"])
  })

  it("requires every selected tag", () => {
    expect(applyFilters(memories, trips, { ...emptyFilters, tags: ["food"] }).map((m) => m.id)).toEqual(["a", "b"])
    expect(applyFilters(memories, trips, { ...emptyFilters, tags: ["food", "market"] }).map((m) => m.id)).toEqual(["a"])
  })
})

describe("filters in the URL", () => {
  it("round-trips through query params and keeps unrelated params", () => {
    const f = { q: "lisbon", from: "2026-01-01", to: "", tags: ["food", "scenic"] }
    const params = filtersToParams(f, new URLSearchParams("view=grid"))
    expect(params.get("view")).toBe("grid")
    expect(params.has("to")).toBe(false)
    expect(filtersFromParams(params)).toEqual(f)
  })

  it("knows when anything is being filtered", () => {
    expect(isFiltering(emptyFilters)).toBe(false)
    expect(isFiltering({ ...emptyFilters, q: "   " })).toBe(false)
    expect(isFiltering({ ...emptyFilters, tags: ["food"] })).toBe(true)
  })
})

describe("helpers", () => {
  it("lists tags by how often they are used", () => {
    expect(allTags(memories)).toEqual(["food", "hike", "market"])
  })

  it("sorts by visit date, newest first", () => {
    expect(sortByVisit(memories).map((m) => m.id)).toEqual(["b", "a", "c"])
  })
})
