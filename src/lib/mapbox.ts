import { config } from "./config"

export type PlaceResult = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
}

type SearchBoxFeature = {
  properties: {
    mapbox_id: string
    name: string
    full_address?: string
    place_formatted?: string
    coordinates: { latitude: number; longitude: number }
  }
}

const BASE = "https://api.mapbox.com/search/searchbox/v1"

function toResult(f: SearchBoxFeature): PlaceResult {
  const p = f.properties
  return {
    id: p.mapbox_id,
    name: p.name,
    address: p.full_address ?? p.place_formatted ?? null,
    latitude: p.coordinates.latitude,
    longitude: p.coordinates.longitude,
  }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  if (!config.hasMapbox) throw new Error("Place search isn't configured")
  const url = new URL(`${BASE}/forward`)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "6")
  url.searchParams.set("access_token", config.mapboxToken)
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Place search failed (${res.status})`)
  const data = (await res.json()) as { features: SearchBoxFeature[] }
  return data.features.map(toResult)
}

export async function reversePlace(latitude: number, longitude: number): Promise<PlaceResult | null> {
  if (!config.hasMapbox) return null
  const url = new URL(`${BASE}/reverse`)
  url.searchParams.set("latitude", String(latitude))
  url.searchParams.set("longitude", String(longitude))
  url.searchParams.set("limit", "1")
  url.searchParams.set("access_token", config.mapboxToken)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { features: SearchBoxFeature[] }
  return data.features[0] ? toResult(data.features[0]) : null
}
