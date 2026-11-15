import { z } from "zod"
import { todayISO } from "./format"

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} can be up to ${max} characters`)

const coordinate = (min: number, max: number, label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .min(min, `${label} must be between ${min} and ${max}`)
    .max(max, `${label} must be between ${min} and ${max}`)
    .nullable()

export const memoryFormSchema = z
  .object({
    placeName: z
      .string()
      .trim()
      .min(1, "Add a place — search, use your location, or type a name")
      .max(120, "Place names can be up to 120 characters"),
    address: optionalText(240, "Address"),
    latitude: coordinate(-90, 90, "Latitude"),
    longitude: coordinate(-180, 180, "Longitude"),
    visitedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date you visited")
      .refine((d) => d <= todayISO(), "The visit date can't be in the future"),
    note: optionalText(2000, "Notes"),
    tags: z
      .array(z.string().trim().min(1).max(24, "Tags can be up to 24 characters"))
      .max(10, "Use up to 10 tags"),
    tripId: z.string().nullable(),
  })
  .refine((v) => (v.latitude === null) === (v.longitude === null), {
    message: "Add both latitude and longitude, or leave both empty",
    path: ["longitude"],
  })

export type MemoryFormValues = z.infer<typeof memoryFormSchema>

export const tripFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give the trip a name")
      .max(80, "Trip names can be up to 80 characters"),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: "The end date must be on or after the start date",
    path: ["endDate"],
  })

export type TripFormValues = z.infer<typeof tripFormSchema>

export const authSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  displayName: z.string().trim().max(60).optional(),
})

export type AuthValues = z.infer<typeof authSchema>

export function normaliseTag(raw: string) {
  return raw.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-").slice(0, 24)
}
