// NEXT_PUBLIC_* values are inlined at build time, so each must be read literally.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""

export const config = {
  supabaseUrl,
  supabaseKey,
  mapboxToken,
  hasSupabase: Boolean(supabaseUrl && supabaseKey),
  hasMapbox: Boolean(mapboxToken),
  photoBucket: "memory-photos",
}
