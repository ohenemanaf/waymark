export type Memory = {
  id: string
  tripId: string | null
  placeName: string
  address: string | null
  latitude: number | null
  longitude: number | null
  /** ISO date, yyyy-MM-dd */
  visitedOn: string
  note: string | null
  photoPath: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type Trip = {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  coverPhotoPath: string | null
  createdAt: string
}

export type Profile = {
  id: string
  displayName: string | null
  approximateLocation: boolean
  createdAt: string
  email?: string | null
}

export type MemoryInput = {
  tripId: string | null
  placeName: string
  address: string | null
  latitude: number | null
  longitude: number | null
  visitedOn: string
  note: string | null
  tags: string[]
}

export type TripInput = {
  name: string
  startDate: string | null
  endDate: string | null
  coverPhotoPath: string | null
}

export type PhotoChange =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; file: Blob }

export type ProgressFn = (fraction: number) => void

export type Mode = "loading" | "none" | "demo" | "cloud"
