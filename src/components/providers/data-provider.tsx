"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { Memory, MemoryInput, PhotoChange, Profile, ProgressFn, Trip, TripInput } from "@/lib/types"
import type { Repository } from "@/lib/data/repository"
import { createDemoRepository } from "@/lib/data/demo-repository"
import { createCloudRepository } from "@/lib/data/cloud-repository"
import { sortByVisit } from "@/lib/filters"
import { useSession } from "./session-provider"

const UNDO_MS = 6000

type Status = "loading" | "ready" | "error"

type DataValue = {
  kind: "demo" | "cloud"
  status: Status
  error: string | null
  reload: () => void
  profile: Profile | null
  /** Sorted newest visit first; excludes memories pending deletion. */
  memories: Memory[]
  trips: Trip[]
  photoUrl: (path: string | null | undefined) => string | null
  getMemory: (id: string) => Memory | undefined
  getTrip: (id: string) => Trip | undefined
  createMemory: (input: MemoryInput, photo: Blob | null, onProgress?: ProgressFn) => Promise<Memory>
  updateMemory: (id: string, input: Partial<MemoryInput>, photo?: PhotoChange, onProgress?: ProgressFn) => Promise<Memory>
  deleteMemory: (id: string) => void
  moveMemories: (ids: string[], tripId: string | null) => Promise<void>
  createTrip: (input: TripInput, memoryIds?: string[]) => Promise<Trip>
  updateTrip: (id: string, input: Partial<TripInput>) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
  updateProfile: (input: Partial<Pick<Profile, "displayName" | "approximateLocation">>) => Promise<void>
  exportData: () => void
  deleteAllData: () => Promise<void>
}

const DataContext = createContext<DataValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { mode, user, supabase } = useSession()

  const repo: Repository = useMemo(() => {
    if (mode === "cloud" && supabase && user) return createCloudRepository(supabase, user.id, user.email)
    return createDemoRepository()
  }, [mode, supabase, user])

  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allMemories, setAllMemories] = useState<Memory[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const resolvePhotos = useCallback(
    async (paths: (string | null)[]) => {
      const wanted = [...new Set(paths.filter((p): p is string => Boolean(p)))]
      if (!wanted.length) return
      const resolved = await repo.photoUrls(wanted)
      setUrls((u) => ({ ...u, ...resolved }))
    },
    [repo],
  )

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to loading when the data source changes
    setStatus("loading")
    repo
      .load()
      .then(async (d) => {
        if (cancelled) return
        setProfile(d.profile)
        setAllMemories(d.memories)
        setTrips(d.trips)
        setStatus("ready")
        setError(null)
        await resolvePhotos(d.memories.map((m) => m.photoPath))
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [repo, resolvePhotos, reloadKey])

  // Commit any pending deletions if the provider goes away (e.g. sign out).
  useEffect(() => {
    const t = timers.current
    return () => t.forEach((timer) => clearTimeout(timer))
  }, [])

  const memories = useMemo(
    () => sortByVisit(allMemories.filter((m) => !pending.includes(m.id))),
    [allMemories, pending],
  )

  const replaceMemory = (m: Memory) => setAllMemories((list) => list.map((x) => (x.id === m.id ? m : x)))

  const value: DataValue = {
    kind: repo.kind,
    status,
    error,
    reload: () => setReloadKey((k) => k + 1),
    profile,
    memories,
    trips: [...trips].sort((a, b) => (b.startDate ?? b.createdAt).localeCompare(a.startDate ?? a.createdAt)),
    photoUrl: (path) => (path ? urls[path] ?? null : null),
    getMemory: (id) => memories.find((m) => m.id === id),
    getTrip: (id) => trips.find((t) => t.id === id),

    async createMemory(input, photo, onProgress) {
      const m = await repo.createMemory(input, photo, onProgress)
      setAllMemories((list) => [...list, m])
      await resolvePhotos([m.photoPath])
      return m
    },

    async updateMemory(id, input, photo = { kind: "keep" }, onProgress) {
      const m = await repo.updateMemory(id, input, photo, onProgress)
      replaceMemory(m)
      await resolvePhotos([m.photoPath])
      return m
    },

    deleteMemory(id) {
      const memory = allMemories.find((m) => m.id === id)
      if (!memory) return
      setPending((p) => [...p, id])
      const commit = async () => {
        timers.current.delete(id)
        try {
          await repo.deleteMemory(memory)
          setAllMemories((list) => list.filter((m) => m.id !== id))
        } catch (e) {
          toast.error((e as Error).message)
        } finally {
          setPending((p) => p.filter((x) => x !== id))
        }
      }
      timers.current.set(id, setTimeout(commit, UNDO_MS))
      toast(`Deleted “${memory.placeName}”`, {
        duration: UNDO_MS,
        action: {
          label: "Undo",
          onClick: () => {
            clearTimeout(timers.current.get(id))
            timers.current.delete(id)
            setPending((p) => p.filter((x) => x !== id))
            toast.success("Memory restored")
          },
        },
      })
    },

    async moveMemories(ids, tripId) {
      await repo.moveMemories(ids, tripId)
      setAllMemories((list) => list.map((m) => (ids.includes(m.id) ? { ...m, tripId } : m)))
    },

    async createTrip(input, memoryIds = []) {
      const t = await repo.createTrip(input)
      setTrips((list) => [...list, t])
      if (memoryIds.length) {
        await repo.moveMemories(memoryIds, t.id)
        setAllMemories((list) => list.map((m) => (memoryIds.includes(m.id) ? { ...m, tripId: t.id } : m)))
      }
      return t
    },

    async updateTrip(id, input) {
      const t = await repo.updateTrip(id, input)
      setTrips((list) => list.map((x) => (x.id === id ? t : x)))
      return t
    },

    async deleteTrip(id) {
      await repo.deleteTrip(id)
      setTrips((list) => list.filter((t) => t.id !== id))
      setAllMemories((list) => list.map((m) => (m.tripId === id ? { ...m, tripId: null } : m)))
    },

    async updateProfile(input) {
      setProfile(await repo.updateProfile(input))
    },

    exportData() {
      const payload = {
        app: "Waymark",
        exportedAt: new Date().toISOString(),
        storage: repo.kind === "cloud" ? "Supabase (your account)" : "Demo data in this browser",
        note: "Photo paths refer to files in your private photo storage. Photos themselves are not embedded.",
        profile,
        trips,
        memories: sortByVisit(allMemories),
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `waymark-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },

    async deleteAllData() {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
      await repo.deleteAllData()
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used inside DataProvider")
  return ctx
}
