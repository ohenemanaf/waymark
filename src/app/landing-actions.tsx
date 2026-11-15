"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "@/components/providers/session-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"

const pill = "h-10 px-5 text-[14px]"

export function LandingActions() {
  const { mode, startDemo } = useSession()
  const router = useRouter()

  const explore = () => {
    startDemo()
    router.push("/journal")
  }

  if (mode === "cloud" || mode === "demo") {
    return (
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/journal" className={cn(buttonVariants(), pill)}>
          Open your journal
        </Link>
        <p className="text-[12px] text-muted-foreground">
          {mode === "demo" ? "You're exploring the demo." : "You're signed in."}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2.5">
        {config.hasSupabase && (
          <Link href="/auth?mode=sign-up" className={cn(buttonVariants(), pill)}>
            Start your journal
          </Link>
        )}
        <Button variant={config.hasSupabase ? "outline" : "default"} className={pill} onClick={explore}>
          Explore the demo
        </Button>
      </div>
      <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">
        The demo comes with sample memories and keeps your changes in this browser only.
        {!config.hasSupabase && " Accounts aren't set up on this site yet."}
      </p>
    </div>
  )
}
