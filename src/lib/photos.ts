export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"]
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export function validatePhoto(file: File): string | null {
  if (!file.type.startsWith("image/")) return "That file isn't an image. Choose a JPG, PNG, WebP or HEIC photo."
  if (file.size > MAX_PHOTO_BYTES) return "That photo is larger than 15 MB. Choose a smaller one."
  return null
}

/**
 * Re-encode a photo as JPEG at a sensible size. Re-encoding also drops embedded
 * metadata such as GPS coordinates. Returns the original file if the browser
 * can't decode it (e.g. HEIC outside Safari).
 */
export async function preparePhoto(file: Blob, maxSide = 2000, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    return blob ?? file
  } catch {
    return file
  }
}

export function extensionFor(blob: Blob) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/gif": "gif",
  }
  return map[blob.type] ?? "jpg"
}

// ---- IndexedDB photo store for demo mode ----

const DB_NAME = "waymark-demo"
const STORE = "photos"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    t.oncomplete = () => db.close()
  })
}

export const localPhotos = {
  put: (key: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, key)),
  get: (key: string) => tx<Blob | undefined>("readonly", (s) => s.get(key)),
  remove: (key: string) => tx("readwrite", (s) => s.delete(key)),
  clear: () => tx("readwrite", (s) => s.clear()),
}
