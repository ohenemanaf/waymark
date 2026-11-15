"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useSession } from "@/components/providers/session-provider"
import { DataProvider, useData } from "@/components/providers/data-provider"
import { AppShell } from "@/components/app-shell"
import { LogoMark } from "@/components/brand"
import { Button } from "@/components/ui/button"

export function FullPageLoading({ label = "Opening your journal…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
      <LogoMark className="size-7 animate-pulse" />
      <p className="text-[13px]">{label}</p>
    </div>
  )
}

function DataGate({ children }: { children: React.ReactNode }) {
  const { status, error, reload } = useData()
  if (status === "loading") return <FullPageLoading />
  if (status === "error")
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div role="alert" className="glass-strong max-w-sm rounded-[28px] p-6 text-center">
          <AlertCircle className="mx-auto mb-2 size-6 text-destructive" aria-hidden />
          <h1 className="text-[26px] leading-tight">We couldn&apos;t open your journal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5 h-9 px-5" onClick={reload}>Try again</Button>
        </div>
      </div>
    )
  return <AppShell>{children}</AppShell>
}

/** Requires an active demo or cloud session, then provides data to the app. */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { mode } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (mode === "none") router.replace("/auth")
  }, [mode, router])

  if (mode === "loading" || mode === "none") return <FullPageLoading />
  return (
    <DataProvider key={mode}>
      <DataGate>{children}</DataGate>
    </DataProvider>
  )
}
