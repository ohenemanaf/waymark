import type { Memory, MemoryInput, PhotoChange, Profile, ProgressFn, Trip, TripInput } from "../types"

/** Everything the UI needs from storage. Demo and cloud modes implement it. */
export interface Repository {
  kind: "demo" | "cloud"
  load(): Promise<{ profile: Profile; memories: Memory[]; trips: Trip[] }>
  /** Resolve storage paths to displayable URLs. */
  photoUrls(paths: string[]): Promise<Record<string, string>>

  createMemory(input: MemoryInput, photo: Blob | null, onProgress?: ProgressFn): Promise<Memory>
  updateMemory(id: string, input: Partial<MemoryInput>, photo: PhotoChange, onProgress?: ProgressFn): Promise<Memory>
  deleteMemory(memory: Memory): Promise<void>
  /** Assign many memories to a trip (or none) in one go. */
  moveMemories(ids: string[], tripId: string | null): Promise<void>

  createTrip(input: TripInput): Promise<Trip>
  updateTrip(id: string, input: Partial<TripInput>): Promise<Trip>
  deleteTrip(id: string): Promise<void>

  updateProfile(input: Partial<Pick<Profile, "displayName" | "approximateLocation">>): Promise<Profile>
  deleteAllData(): Promise<void>
}

export class PhotoUploadError extends Error {
  constructor(message = "The photo couldn't be uploaded") {
    super(message)
    this.name = "PhotoUploadError"
  }
}

export function newId() {
  return crypto.randomUUID()
}
