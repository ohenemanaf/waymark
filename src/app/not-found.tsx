import Link from "next/link"
import { Logo } from "@/components/brand"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-10" />
      <h1 className="text-[40px] leading-tight">This page isn&apos;t on the map</h1>
      <p className="mt-3 max-w-sm text-[14px] text-muted-foreground">
        The link may be mistyped, or the page has moved. Your journal is still where you left it.
      </p>
      <Link href="/journal" className={cn(buttonVariants(), "mt-7 h-10 px-5")}>
        Open your journal
      </Link>
    </main>
  )
}
