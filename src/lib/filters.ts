import type { Memory, Trip } from "./types"

export type MemoryFilters = {
  q: string
  from: string
  to: string
  tags: string[]
}

export const emptyFilters: MemoryFilters = { q: "", from: "", to: "", tags: [] }

export function filtersFromParams(params: URLSearchParams): MemoryFilters {
  return {
    q: params.get("q") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    tags: (params.get("tags") ?? "").split(",").filter(Boolean),
  }
}

export function filtersToParams(f: MemoryFilters, base: URLSearchParams) {
  const p = new URLSearchParams(base)
  for (const [k, v] of [["q", f.q], ["from", f.from], ["to", f.to], ["tags", f.tags.join(",")]] as const) {
    if (v) p.set(k, v)
    else p.delete(k)
  }
  return p
}

export function isFiltering(f: MemoryFilters) {
  return Boolean(f.q.trim() || f.from || f.to || f.tags.length)
}

export function applyFilters(memories: Memory[], trips: Trip[], f: MemoryFilters) {
  const q = f.q.trim().toLowerCase()
  const tripNames = new Map(trips.map((t) => [t.id, t.name.toLowerCase()]))
  return memories.filter((m) => {
    if (f.from && m.visitedOn < f.from) return false
    if (f.to && m.visitedOn > f.to) return false
    if (f.tags.length && !f.tags.every((t) => m.tags.includes(t))) return false
    if (q) {
      const haystack = [m.placeName, m.address, m.note, m.tripId ? tripNames.get(m.tripId) : ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function allTags(memories: Memory[]) {
  const counts = new Map<string, number>()
  for (const m of memories) for (const t of m.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
}

export function sortByVisit(memories: Memory[]) {
  return [...memories].sort(
    (a, b) => b.visitedOn.localeCompare(a.visitedOn) || b.createdAt.localeCompare(a.createdAt),
  )
}
