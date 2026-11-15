export type LngLat = { latitude: number; longitude: number }

export function hasLocation<T extends { latitude: number | null; longitude: number | null }>(
  m: T,
): m is T & LngLat {
  return m.latitude !== null && m.longitude !== null
}

export function distanceKm(a: LngLat, b: LngLat) {
  const R = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export type Bounds = { west: number; south: number; east: number; north: number }

export function boundsOf(points: LngLat[]): Bounds | null {
  if (points.length === 0) return null
  let west = 180, east = -180, south = 90, north = -90
  for (const p of points) {
    west = Math.min(west, p.longitude)
    east = Math.max(east, p.longitude)
    south = Math.min(south, p.latitude)
    north = Math.max(north, p.latitude)
  }
  return { west, south, east, north }
}

/** Round to ~1 km so a stored point doesn't pinpoint a doorstep. */
export function approximate(value: number | null) {
  return value === null ? null : Math.round(value * 100) / 100
}
