"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Map, Plus, Route, Settings } from "lucide-react"
import { Logo } from "@/components/brand"
import { useData } from "@/components/providers/data-provider"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/map", label: "Map", icon: Map },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

function useActive() {
  const pathname = usePathname()
  return (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/journal" && pathname.startsWith("/memories") && !pathname.endsWith("/new"))
}

/** Where the journal is saved. Shown as words; the dot only reinforces it. */
export function ModeBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const { kind } = useData()
  const demo = kind === "demo"
  return (
    <span className={cn("inline-flex items-center gap-2 text-[12px] text-muted-foreground", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", demo ? "bg-amber-500" : "bg-brand")} />
      {compact ? (demo ? "Demo" : "Private") : demo ? "Demo journal, saved in this browser" : "Private journal, synced to your account"}
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isActive = useActive()
  const pathname = usePathname()
  const onAdd = pathname === "/memories/new"
  const fullBleed = pathname === "/map"

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <a href="#main" className="sr-only z-50 rounded-full bg-card px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-dvh flex-col px-3 pt-5 pb-4 lg:flex">
        <Link href="/journal" className="mb-7 px-2.5" aria-label="Waymark journal home">
          <Logo />
        </Link>
        <nav aria-label="Main">
          <ul className="space-y-0.5">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground",
                      active && "surface text-foreground hover:bg-card",
                    )}
                  >
                    <Icon className={cn("size-[17px]", active && "text-brand")} strokeWidth={1.8} aria-hidden />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <Link
          href="/memories/new"
          aria-current={onAdd ? "page" : undefined}
          className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          <Plus className="size-4" aria-hidden /> Add a memory
        </Link>
        <div className="mt-auto px-2.5">
          <ModeBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between px-4 lg:hidden">
          <Link href="/journal" aria-label="Waymark journal home">
            <Logo className="[&>span:last-child]:text-[20px]" />
          </Link>
          <ModeBadge compact />
        </header>

        <main id="main" className={cn("flex-1 lg:pb-0", !fullBleed && "pb-28")}>
          {children}
        </main>
      </div>

      {/* Mobile tab bar: a floating glass capsule, with Add in thumb reach */}
      <nav aria-label="Main" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 lg:hidden">
        <ul className="glass-strong mx-auto grid h-[60px] max-w-md grid-cols-5 items-center rounded-full px-1.5">
          {nav.slice(0, 2).map((item) => (
            <MobileItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
          <li className="flex justify-center">
            <Link
              href="/memories/new"
              aria-label="Add a memory"
              aria-current={onAdd ? "page" : undefined}
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
            >
              <Plus className="size-5" aria-hidden />
            </Link>
          </li>
          {nav.slice(2).map((item) => (
            <MobileItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </ul>
      </nav>
    </div>
  )
}

function MobileItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Map; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium text-muted-foreground",
          active && "text-brand",
        )}
      >
        <Icon className="size-[19px]" strokeWidth={active ? 2.1 : 1.8} aria-hidden />
        {label}
      </Link>
    </li>
  )
}
