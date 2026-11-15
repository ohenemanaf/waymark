import type { SupabaseClient } from "@supabase/supabase-js"
import type { Memory, MemoryInput, Trip, TripInput } from "../types"
import { config } from "../config"
import { approximate } from "../geo"
import { extensionFor, preparePhoto } from "../photos"
import { PhotoUploadError, newId, type Repository } from "./repository"

type MemoryRow = {
  id: string
  user_id: string
  trip_id: string | null
  place_name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  visited_on: string
  note: string | null
  photo_path: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

type TripRow = {
  id: string
  user_id: string
  name: string
  start_date: string | null
  end_date: string | null
  cover_photo_path: string | null
  created_at: string
}

type ProfileRow = { id: string; display_name: string | null; approximate_location: boolean; created_at: string }

const toMemory = (r: MemoryRow): Memory => ({
  id: r.id,
  tripId: r.trip_id,
  placeName: r.place_name,
  address: r.address,
  latitude: r.latitude,
  longitude: r.longitude,
  visitedOn: r.visited_on,
  note: r.note,
  photoPath: r.photo_path,
  tags: r.tags ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toTrip = (r: TripRow): Trip => ({
  id: r.id,
  name: r.name,
  startDate: r.start_date,
  endDate: r.end_date,
  coverPhotoPath: r.cover_photo_path,
  createdAt: r.created_at,
})

function memoryPatch(input: Partial<MemoryInput>) {
  const row: Partial<MemoryRow> = {}
  if ("tripId" in input) row.trip_id = input.tripId ?? null
  if (input.placeName !== undefined) row.place_name = input.placeName
  if ("address" in input) row.address = input.address ?? null
  if ("latitude" in input) row.latitude = input.latitude ?? null
  if ("longitude" in input) row.longitude = input.longitude ?? null
  if (input.visitedOn !== undefined) row.visited_on = input.visitedOn
  if ("note" in input) row.note = input.note ?? null
  if (input.tags !== undefined) row.tags = input.tags
  return row
}

function tripPatch(input: Partial<TripInput>) {
  const row: Partial<TripRow> = {}
  if (input.name !== undefined) row.name = input.name
  if ("startDate" in input) row.start_date = input.startDate ?? null
  if ("endDate" in input) row.end_date = input.endDate ?? null
  if ("coverPhotoPath" in input) row.cover_photo_path = input.coverPhotoPath ?? null
  return row
}

function fail(error: { message: string } | null, what: string): asserts error is null {
  if (error) throw new Error(`${what}: ${error.message}`)
}

export function createCloudRepository(supabase: SupabaseClient, userId: string, email: string | null): Repository {
  const bucket = config.photoBucket
  let approximateLocation = false

  /** Upload with XHR so we can report real progress. */
  async function upload(file: Blob, onProgress?: (n: number) => void): Promise<string> {
    const prepared = await preparePhoto(file)
    const path = `${userId}/${newId()}.${extensionFor(prepared)}`
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new PhotoUploadError("Your session expired. Sign in again to upload photos.")

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `${config.supabaseUrl}/storage/v1/object/${bucket}/${path}`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.setRequestHeader("apikey", config.supabaseKey)
      xhr.setRequestHeader("Content-Type", prepared.type || "image/jpeg")
      xhr.setRequestHeader("x-upsert", "false")
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new PhotoUploadError(`The photo couldn't be uploaded (error ${xhr.status}).`))
      xhr.onerror = () => reject(new PhotoUploadError("The photo couldn't be uploaded. Check your connection."))
      xhr.send(prepared)
    })
    onProgress?.(1)
    return path
  }

  const removePhotos = async (paths: string[]) => {
    if (paths.length) await supabase.storage.from(bucket).remove(paths)
  }

  const place = (input: Partial<MemoryInput>) => {
    if (!approximateLocation) return input
    const out = { ...input }
    if ("latitude" in out) out.latitude = approximate(out.latitude ?? null)
    if ("longitude" in out) out.longitude = approximate(out.longitude ?? null)
    return out
  }

  return {
    kind: "cloud",

    async load() {
      const [p, m, t] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle<ProfileRow>(),
        supabase.from("memories").select("*").order("visited_on", { ascending: false }).returns<MemoryRow[]>(),
        supabase.from("trips").select("*").order("start_date", { ascending: false }).returns<TripRow[]>(),
      ])
      fail(p.error, "Couldn't load your profile")
      fail(m.error, "Couldn't load your memories")
      fail(t.error, "Couldn't load your trips")
      let profileRow = p.data
      if (!profileRow) {
        // The signup trigger normally creates this; recover if it didn't.
        const ins = await supabase.from("profiles").insert({ id: userId }).select().single<ProfileRow>()
        fail(ins.error, "Couldn't create your profile")
        profileRow = ins.data
      }
      approximateLocation = profileRow.approximate_location
      return {
        profile: {
          id: profileRow.id,
          displayName: profileRow.display_name,
          approximateLocation: profileRow.approximate_location,
          createdAt: profileRow.created_at,
          email,
        },
        memories: (m.data ?? []).map(toMemory),
        trips: (t.data ?? []).map(toTrip),
      }
    },

    async photoUrls(paths) {
      if (!paths.length) return {}
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 60)
      if (error) return {}
      const out: Record<string, string> = {}
      for (const d of data) if (d.signedUrl && d.path) out[d.path] = d.signedUrl
      return out
    },

    async createMemory(input, photo, onProgress) {
      const photoPath = photo ? await upload(photo, onProgress) : null
      const { data, error } = await supabase
        .from("memories")
        .insert({ ...memoryPatch(place(input)), user_id: userId, photo_path: photoPath })
        .select()
        .single<MemoryRow>()
      if (error) {
        if (photoPath) await removePhotos([photoPath])
        fail(error, "Couldn't save the memory")
      }
      return toMemory(data!)
    },

    async updateMemory(id, input, photo, onProgress) {
      const row: Partial<MemoryRow> = memoryPatch(place(input))
      let oldPath: string | null = null
      if (photo.kind !== "keep") {
        const current = await supabase.from("memories").select("photo_path").eq("id", id).single<{ photo_path: string | null }>()
        oldPath = current.data?.photo_path ?? null
        row.photo_path = photo.kind === "replace" ? await upload(photo.file, onProgress) : null
      }
      const { data, error } = await supabase.from("memories").update(row).eq("id", id).select().single<MemoryRow>()
      fail(error, "Couldn't update the memory")
      if (oldPath) await removePhotos([oldPath])
      return toMemory(data!)
    },

    async deleteMemory(memory) {
      const { error } = await supabase.from("memories").delete().eq("id", memory.id)
      fail(error, "Couldn't delete the memory")
      if (memory.photoPath) await removePhotos([memory.photoPath])
    },

    async moveMemories(ids, tripId) {
      if (!ids.length) return
      const { error } = await supabase.from("memories").update({ trip_id: tripId }).in("id", ids)
      fail(error, "Couldn't move those memories")
    },

    async createTrip(input) {
      const { data, error } = await supabase
        .from("trips")
        .insert({ ...tripPatch(input), user_id: userId })
        .select()
        .single<TripRow>()
      fail(error, "Couldn't create the trip")
      return toTrip(data!)
    },

    async updateTrip(id, input) {
      const { data, error } = await supabase.from("trips").update(tripPatch(input)).eq("id", id).select().single<TripRow>()
      fail(error, "Couldn't update the trip")
      return toTrip(data!)
    },

    async deleteTrip(id) {
      const { error } = await supabase.from("trips").delete().eq("id", id)
      fail(error, "Couldn't delete the trip")
    },

    async updateProfile(input) {
      const row: Partial<ProfileRow> = {}
      if ("displayName" in input) row.display_name = input.displayName ?? null
      if (input.approximateLocation !== undefined) row.approximate_location = input.approximateLocation
      const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select().single<ProfileRow>()
      fail(error, "Couldn't update your profile")
      approximateLocation = data!.approximate_location
      return {
        id: data!.id,
        displayName: data!.display_name,
        approximateLocation: data!.approximate_location,
        createdAt: data!.created_at,
        email,
      }
    },

    async deleteAllData() {
      // 1. Remove every photo in the user's folder (storage rows can't be deleted via SQL).
      for (;;) {
        const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 100 })
        fail(error, "Couldn't list your photos")
        if (!data.length) break
        const { error: rmError } = await supabase.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`))
        fail(rmError, "Couldn't delete your photos")
        if (data.length < 100) break
      }
      // 2. Delete the auth user; profiles, trips and memories cascade.
      const { error } = await supabase.rpc("delete_account")
      fail(error, "Couldn't delete your account")
      await supabase.auth.signOut({ scope: "local" })
    },
  }
}
