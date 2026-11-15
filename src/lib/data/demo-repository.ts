import type { Memory, Profile, Trip } from "../types"
import { localPhotos, preparePhoto } from "../photos"
import { approximate } from "../geo"
import { PhotoUploadError, newId, type Repository } from "./repository"
import { seedMemories, seedProfile, seedTrips } from "./seed"

const KEY = "waymark:demo:v2"
const LEGACY_KEYS = ["waymark:demo:v1"]

type DemoState = { profile: Profile; memories: Memory[]; trips: Trip[] }

function read(): DemoState {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k)
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    // fall through to a fresh seed
  }
  const fresh = { profile: seedProfile, memories: seedMemories, trips: seedTrips }
  write(fresh)
  return fresh
}

function write(state: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    throw new Error("Your browser's storage is full, so the demo couldn't save this change.")
  }
}

/** Simulated progress so the demo shows the same feedback as a real upload. */
async function storePhoto(file: Blob, onProgress?: (n: number) => void) {
  onProgress?.(0.1)
  const prepared = await preparePhoto(file, 1600, 0.82)
  onProgress?.(0.6)
  const path = `local:${newId()}`
  try {
    await localPhotos.put(path, prepared)
  } catch {
    throw new PhotoUploadError("The photo couldn't be saved in this browser.")
  }
  onProgress?.(1)
  return path
}

const objectUrls = new Map<string, string>()

export function resetDemo() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  objectUrls.forEach((u) => URL.revokeObjectURL(u))
  objectUrls.clear()
  return localPhotos.clear().catch(() => undefined)
}

export function createDemoRepository(): Repository {
  const mutate = <T,>(fn: (s: DemoState) => T): T => {
    const s = read()
    const result = fn(s)
    write(s)
    return result
  }

  const coords = (s: DemoState, lat: number | null, lng: number | null) =>
    s.profile.approximateLocation ? [approximate(lat), approximate(lng)] : [lat, lng]

  return {
    kind: "demo",

    async load() {
      return read()
    },

    async photoUrls(paths) {
      const out: Record<string, string> = {}
      for (const p of paths) {
        if (p.startsWith("/demo/")) out[p] = p
        else if (objectUrls.has(p)) out[p] = objectUrls.get(p)!
        else {
          const blob = await localPhotos.get(p).catch(() => undefined)
          if (blob) {
            const url = URL.createObjectURL(blob)
            objectUrls.set(p, url)
            out[p] = url
          }
        }
      }
      return out
    },

    async createMemory(input, photo, onProgress) {
      const photoPath = photo ? await storePhoto(photo, onProgress) : null
      return mutate((s) => {
        const now = new Date().toISOString()
        const [latitude, longitude] = coords(s, input.latitude, input.longitude)
        const m: Memory = { ...input, latitude, longitude, id: newId(), photoPath, createdAt: now, updatedAt: now }
        s.memories.push(m)
        return m
      })
    },

    async updateMemory(id, input, photo, onProgress) {
      let photoPath: string | null | undefined
      if (photo.kind === "replace") photoPath = await storePhoto(photo.file, onProgress)
      if (photo.kind === "remove") photoPath = null
      return mutate((s) => {
        const m = s.memories.find((x) => x.id === id)
        if (!m) throw new Error("That memory no longer exists.")
        const old = m.photoPath
        Object.assign(m, input, { updatedAt: new Date().toISOString() })
        if ("latitude" in input || "longitude" in input) {
          ;[m.latitude, m.longitude] = coords(s, m.latitude, m.longitude)
        }
        if (photoPath !== undefined) {
          m.photoPath = photoPath
          if (old?.startsWith("local:")) void localPhotos.remove(old).catch(() => undefined)
        }
        return { ...m }
      })
    },

    async deleteMemory(memory) {
      mutate((s) => {
        s.memories = s.memories.filter((m) => m.id !== memory.id)
      })
      if (memory.photoPath?.startsWith("local:")) await localPhotos.remove(memory.photoPath).catch(() => undefined)
    },

    async moveMemories(ids, tripId) {
      mutate((s) => {
        for (const m of s.memories) if (ids.includes(m.id)) m.tripId = tripId
      })
    },

    async createTrip(input) {
      return mutate((s) => {
        const t: Trip = { ...input, id: newId(), createdAt: new Date().toISOString() }
        s.trips.push(t)
        return t
      })
    },

    async updateTrip(id, input) {
      return mutate((s) => {
        const t = s.trips.find((x) => x.id === id)
        if (!t) throw new Error("That trip no longer exists.")
        Object.assign(t, input)
        return { ...t }
      })
    },

    async deleteTrip(id) {
      mutate((s) => {
        s.trips = s.trips.filter((t) => t.id !== id)
        for (const m of s.memories) if (m.tripId === id) m.tripId = null
      })
    },

    async updateProfile(input) {
      return mutate((s) => {
        Object.assign(s.profile, input)
        return { ...s.profile }
      })
    },

    async deleteAllData() {
      await resetDemo()
    },
  }
}
