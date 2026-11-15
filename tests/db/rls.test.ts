/**
 * Integration tests for the Supabase schema, Row Level Security and storage policies.
 * They run against a local Supabase stack (`npx supabase start`) and are skipped when it isn't running.
 *
 *   SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_SERVICE_KEY
 *
 * default to the standard local stack values printed by `npx supabase status -o env`. Those demo keys are
 * public and identical for every local Supabase install; they are not secrets.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const url = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321"
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
const serviceKey =
  process.env.SUPABASE_TEST_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

async function stackIsUp() {
  if (!anonKey || !serviceKey) return false
  try {
    const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } })
    return res.ok
  } catch {
    return false
  }
}

const up = await stackIsUp()
const client = () => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = () => createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const BUCKET = "memory-photos"
const tinyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

async function signUp(name: string) {
  const c = client()
  const email = `${name}-${crypto.randomUUID().slice(0, 8)}@waymark.test`
  const { data, error } = await c.auth.signUp({ email, password: "correct-horse-battery", options: { data: { display_name: name } } })
  if (error || !data.user) throw error ?? new Error("no user")
  return { c, id: data.user.id }
}

describe.skipIf(!up)("database security (local Supabase)", () => {
  let ama: { c: SupabaseClient; id: string }
  let kofi: { c: SupabaseClient; id: string }
  let tripId: string
  let memoryId: string

  beforeAll(async () => {
    ama = await signUp("Ama")
    kofi = await signUp("Kofi")
  })

  afterAll(async () => {
    const a = admin()
    for (const u of [ama, kofi]) if (u) await a.auth.admin.deleteUser(u.id).catch(() => undefined)
  })

  it("creates a profile with the display name on sign-up", async () => {
    const { data } = await ama.c.from("profiles").select("display_name, approximate_location").single()
    expect(data).toEqual({ display_name: "Ama", approximate_location: false })
  })

  it("lets a person create their own trip and memory", async () => {
    const trip = await ama.c.from("trips").insert({ name: "Lisbon long weekend", start_date: "2026-04-17", end_date: "2026-04-20" }).select().single()
    expect(trip.error).toBeNull()
    tripId = trip.data!.id
    expect(trip.data!.user_id).toBe(ama.id)

    const m = await ama.c
      .from("memories")
      .insert({ trip_id: tripId, place_name: "Belém Tower", latitude: 38.69, longitude: -9.21, visited_on: "2026-04-19", tags: ["food"] })
      .select()
      .single()
    expect(m.error).toBeNull()
    memoryId = m.data!.id
  })

  it("hides one person's data from another", async () => {
    for (const table of ["memories", "trips", "profiles"]) {
      const { data } = await kofi.c.from(table).select("*").neq(table === "profiles" ? "id" : "user_id", kofi.id)
      expect(data, table).toEqual([])
    }
  })

  it("stops anyone else editing or deleting it", async () => {
    const upd = await kofi.c.from("memories").update({ place_name: "Hacked" }).eq("id", memoryId).select()
    expect(upd.data).toEqual([])
    const del = await kofi.c.from("memories").delete().eq("id", memoryId).select()
    expect(del.data).toEqual([])
    const { data } = await ama.c.from("memories").select("place_name").eq("id", memoryId).single()
    expect(data?.place_name).toBe("Belém Tower")
  })

  it("stops writing rows as someone else or into their trip", async () => {
    const asAma = await kofi.c.from("memories").insert({ user_id: ama.id, place_name: "Sneaky" })
    expect(asAma.error).not.toBeNull()
    const intoAmasTrip = await kofi.c.from("memories").insert({ trip_id: tripId, place_name: "Sneaky" })
    expect(intoAmasTrip.error).not.toBeNull()
    const moveIntoAmasTrip = await kofi.c.from("memories").insert({ place_name: "Mine" }).select().single()
    const moved = await kofi.c.from("memories").update({ trip_id: tripId }).eq("id", moveIntoAmasTrip.data!.id)
    expect(moved.error).not.toBeNull()
  })

  it("gives anonymous visitors nothing", async () => {
    const anon = client()
    expect((await anon.from("memories").select("*")).data).toEqual([])
    expect((await anon.rpc("delete_account")).error).not.toBeNull()
  })

  it("rejects invalid values at the database", async () => {
    const bad: Record<string, unknown>[] = [
      { place_name: "" },
      { place_name: "x", latitude: 91, longitude: 0 },
      { place_name: "x", latitude: 10 },
      { place_name: "x", tags: Array.from({ length: 11 }, (_, i) => `t${i}`) },
    ]
    for (const row of bad) expect((await ama.c.from("memories").insert(row)).error, JSON.stringify(row)).not.toBeNull()
    expect((await ama.c.from("trips").insert({ name: "Backwards", start_date: "2026-02-02", end_date: "2026-02-01" })).error).not.toBeNull()
  })

  it("keeps memories when their trip is deleted", async () => {
    const t = await ama.c.from("trips").insert({ name: "Temporary" }).select().single()
    const m = await ama.c.from("memories").insert({ trip_id: t.data!.id, place_name: "Kept" }).select().single()
    await ama.c.from("trips").delete().eq("id", t.data!.id)
    const { data } = await ama.c.from("memories").select("trip_id").eq("id", m.data!.id).single()
    expect(data?.trip_id).toBeNull()
  })

  it("updates updated_at on edit", async () => {
    const before = await ama.c.from("memories").select("updated_at").eq("id", memoryId).single()
    await new Promise((r) => setTimeout(r, 20))
    const after = await ama.c.from("memories").update({ note: "Warm pastéis de nata" }).eq("id", memoryId).select("updated_at").single()
    expect(new Date(after.data!.updated_at).getTime()).toBeGreaterThan(new Date(before.data!.updated_at).getTime())
  })

  it("keeps photos private to their owner's folder", async () => {
    const own = await ama.c.storage.from(BUCKET).upload(`${ama.id}/belem.jpg`, tinyJpeg, { contentType: "image/jpeg" })
    expect(own.error).toBeNull()

    const intoAmas = await kofi.c.storage.from(BUCKET).upload(`${ama.id}/evil.jpg`, tinyJpeg, { contentType: "image/jpeg" })
    expect(intoAmas.error).not.toBeNull()

    const read = await kofi.c.storage.from(BUCKET).download(`${ama.id}/belem.jpg`)
    expect(read.error).not.toBeNull()
    const signed = await kofi.c.storage.from(BUCKET).createSignedUrl(`${ama.id}/belem.jpg`, 60)
    expect(signed.error).not.toBeNull()

    const ownSigned = await ama.c.storage.from(BUCKET).createSignedUrl(`${ama.id}/belem.jpg`, 60)
    expect(ownSigned.error).toBeNull()

    const notAnImage = await ama.c.storage.from(BUCKET).upload(`${ama.id}/notes.txt`, new Uint8Array([1]), { contentType: "text/plain" })
    expect(notAnImage.error).not.toBeNull()
  })

  it("deletes an account and everything it owns", async () => {
    await ama.c.storage.from(BUCKET).remove([`${ama.id}/belem.jpg`])
    const { error } = await ama.c.rpc("delete_account")
    expect(error).toBeNull()

    const a = admin()
    expect((await a.auth.admin.getUserById(ama.id)).data.user).toBeNull()
    for (const table of ["memories", "trips"]) {
      const { count } = await a.from(table).select("*", { count: "exact", head: true }).eq("user_id", ama.id)
      expect(count, table).toBe(0)
    }
    const { count } = await a.from("profiles").select("*", { count: "exact", head: true }).eq("id", ama.id)
    expect(count).toBe(0)
    // Kofi is untouched.
    expect((await a.auth.admin.getUserById(kofi.id)).data.user?.id).toBe(kofi.id)
  })
})
