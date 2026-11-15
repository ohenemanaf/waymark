import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Logo } from "@/components/brand"
import { AuthForm } from "./auth-form"

export const metadata: Metadata = { title: "Sign in" }

export default function AuthPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <Link href="/" aria-label="Waymark home" className="mt-6 mb-10">
        <Logo />
      </Link>
      <main className="w-full max-w-sm">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-[28px] bg-black/[0.04]" />}>
          <AuthForm />
        </Suspense>
      </main>
    </div>
  )
}
