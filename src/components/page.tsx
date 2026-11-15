import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

/** The single shared page container, so every screen lines up. */
export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 lg:py-10", className)}>{children}</div>
}

/** Page title in the display face, with an optional quiet subtitle. */
export function PageTitle({ children, subtitle, className }: { children: React.ReactNode; subtitle?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h1 className="text-[32px] leading-[1.05] sm:text-[38px]">{children}</h1>
      {subtitle && <p className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-ml-1 mb-4 inline-flex items-center gap-0.5 rounded-full py-1 pr-2.5 pl-1 text-[13px] font-medium text-brand hover:bg-brand-soft">
      <ChevronLeft className="size-4" aria-hidden /> {children}
    </Link>
  )
}

export function NotFoundState({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <PageContainer className="max-w-xl text-center">
      <h1 className="mt-12 text-[28px]">{title}</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">It may have been deleted, or the link is out of date.</p>
      <Link href={backHref} className="mt-5 inline-block text-[13px] font-semibold text-brand hover:underline">
        {backLabel}
      </Link>
    </PageContainer>
  )
}
