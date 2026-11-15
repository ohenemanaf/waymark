"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { config } from "./config"

let client: SupabaseClient | null = null

/**
 * Browser client using the public (anon/publishable) key only. Row Level
 * Security in the database is what keeps each person's data private; the
 * service-role key is never used by this app.
 */
export function getSupabase(): SupabaseClient | null {
  if (!config.hasSupabase) return null
  if (typeof window === "undefined") return null
  client ??= createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  })
  return client
}
