import { CircleAlert } from "lucide-react"

/** Inline validation message. Uses an icon and text, never colour alone. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-start gap-1 text-xs text-destructive">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}
