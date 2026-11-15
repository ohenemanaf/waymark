import { cn } from "@/lib/utils"

/** A waypoint seen from above: an ink ring around a lagoon point. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--ink)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4" fill="var(--lagoon)" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-5" />
      <span className="font-heading text-[22px] leading-none tracking-[-0.01em]">Waymark</span>
    </span>
  )
}
