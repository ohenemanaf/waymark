"use client"

import { useId, useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { normaliseTag } from "@/lib/schema"

const DEFAULT_SUGGESTIONS = ["food", "scenic", "weekend", "nature", "history", "coffee"]

export function TagInput({
  value,
  onChange,
  known,
  describedBy,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  known: string[]
  describedBy?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState("")

  const add = (raw: string) => {
    const t = normaliseTag(raw)
    if (t && !value.includes(t) && value.length < 10) onChange([...value, t])
    setDraft("")
  }

  const suggestions = [...new Set([...known, ...DEFAULT_SUGGESTIONS])].filter((t) => !value.includes(t)).slice(0, 8)

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Chosen tags">
          {value.map((t) => (
            <li key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-brand-soft pr-1 pl-3 text-[12px] font-medium text-brand">
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="flex size-5 items-center justify-center rounded-full hover:bg-brand/15"
                aria-label={`Remove tag ${t}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={`${id}-tags`}
        aria-label="Add a tag"
        aria-describedby={describedBy}
        placeholder="Type a tag and press Enter"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            add(draft)
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => draft && add(draft)}
        className=""
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted-foreground">Suggestions</span>
          {suggestions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="inline-flex h-7 items-center gap-0.5 rounded-full bg-secondary px-2.5 text-[12px] font-medium text-foreground/70 hover:bg-black/[0.08] hover:text-foreground"
            >
              <Plus className="size-3" aria-hidden /> {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
