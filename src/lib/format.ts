import { format, parseISO, isSameMonth, isSameYear } from "date-fns"

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd")
}

export function formatDate(iso: string, style: "long" | "short" = "long") {
  const d = parseISO(iso)
  return format(d, style === "long" ? "EEEE d MMMM yyyy" : "d MMM yyyy")
}

export function formatMonth(iso: string) {
  return format(parseISO(iso), "MMMM yyyy")
}

export function formatRange(start: string | null, end: string | null) {
  if (!start && !end) return "No dates yet"
  if (!start || !end || start === end) return formatDate((start ?? end)!, "short")
  const a = parseISO(start)
  const b = parseISO(end)
  if (isSameMonth(a, b)) return `${format(a, "d")}–${format(b, "d MMM yyyy")}`
  if (isSameYear(a, b)) return `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`
  return `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`
}

export function greeting(name: string | null | undefined) {
  const h = new Date().getHours()
  const part = h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  return name ? `${part}, ${name}` : part
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`
}
