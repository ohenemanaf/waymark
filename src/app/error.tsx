"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Catches unexpected errors in any page and offers a way back without losing the session. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div role="alert" className="glass-strong w-full max-w-sm rounded-[28px] p-6 text-center">
        <h1 className="text-[28px] leading-tight">Something went wrong</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          This screen hit an unexpected error. Your saved memories aren&apos;t affected. Try again, or go back to your
          journal.
        </p>
        {error.digest && <p className="mt-2 text-[11px] text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-5 flex justify-center gap-2">
          <Button className="h-9 px-5" onClick={reset}>Try again</Button>
          <Link href="/journal" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-5")}>Journal</Link>
        </div>
      </div>
    </main>
  )
}
