"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MailCheck } from "lucide-react"
import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/field-error"
import { authSchema, type AuthValues } from "@/lib/schema"
import { config } from "@/lib/config"

export function AuthForm() {
  const params = useSearchParams()
  const isSignUp = params.get("mode") === "sign-up"
  const router = useRouter()
  const { mode, signIn, signUp, startDemo } = useSession()
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  })
  const { register, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState

  useEffect(() => {
    if (mode === "cloud") router.replace("/journal")
  }, [mode, router])

  const explore = () => {
    startDemo()
    router.push("/journal")
  }

  if (!config.hasSupabase) {
    return (
      <div className="glass-strong rounded-[28px] p-6">
        <h1 className="text-[30px] leading-tight">Accounts aren&apos;t set up here yet</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This copy of Waymark has no Supabase connection, so sign-in is turned off. You can still try everything in
          the demo — it saves to this browser only.
        </p>
        <Button className="mt-5 h-10 w-full" onClick={explore}>
          Explore the demo
        </Button>
      </div>
    )
  }

  if (sentTo) {
    return (
      <div className="glass-strong rounded-[28px] p-6 text-center" role="status">
        <MailCheck className="mx-auto mb-3 size-6 text-brand" aria-hidden />
        <h1 className="text-[30px] leading-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{sentTo}</strong>. Open it on this device to
          start your journal.
        </p>
      </div>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      if (isSignUp) {
        const { needsConfirmation } = await signUp(values.email, values.password, values.displayName)
        if (needsConfirmation) setSentTo(values.email)
        else router.replace("/journal")
      } else {
        await signIn(values.email, values.password)
        router.replace("/journal")
      }
    } catch (e) {
      setFormError((e as Error).message)
    }
  })

  return (
    <div className="glass-strong rounded-[28px] p-6">
      <h1 className="text-[30px] leading-tight">{isSignUp ? "Start your journal" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSignUp ? "Your memories stay private to your account." : "Sign in to open your journal."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="displayName">
              Your name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="displayName" autoComplete="given-name" className="h-10" {...register("displayName")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-10"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="h-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>

        {formError && (
          <p role="alert" className="rounded-2xl bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to Waymark? "}
        <Link href={isSignUp ? "/auth" : "/auth?mode=sign-up"} className="font-semibold text-brand hover:underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <div className="mt-4 border-t border-hairline pt-4">
        <Button variant="ghost" className="h-10 w-full text-muted-foreground" onClick={explore}>
          Explore the demo instead
        </Button>
      </div>
    </div>
  )
}
