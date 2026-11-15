"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"
import { resetDemo } from "@/lib/data/demo-repository"
import type { Mode } from "@/lib/types"

const MODE_KEY = "waymark:mode"

type User = { id: string; email: string | null }

type SessionValue = {
  mode: Mode
  user: User | null
  supabase: SupabaseClient | null
  startDemo: () => void
  leaveDemo: (opts?: { reset?: boolean }) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

function readMode() {
  try {
    return localStorage.getItem(MODE_KEY)
  } catch {
    return null
  }
}

function writeMode(mode: "demo" | null) {
  try {
    if (mode) localStorage.setItem(MODE_KEY, mode)
    else localStorage.removeItem(MODE_KEY)
  } catch {}
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("loading")
  const [user, setUser] = useState<User | null>(null)
  const [supabase] = useState(() => getSupabase())

  useEffect(() => {
    let cancelled = false
    const demo = readMode() === "demo"
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage on mount
      setMode(demo ? "demo" : "none")
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const u = data.session?.user
      if (demo) setMode("demo")
      else if (u) {
        setUser({ id: u.id, email: u.email ?? null })
        setMode("cloud")
      } else setMode("none")
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (readMode() === "demo") return
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setMode(u ? "cloud" : "none")
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const startDemo = useCallback(() => {
    writeMode("demo")
    setMode("demo")
  }, [])

  const leaveDemo = useCallback(
    async (opts?: { reset?: boolean }) => {
      if (opts?.reset) await resetDemo()
      writeMode(null)
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setMode(u ? "cloud" : "none")
    },
    [supabase],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Cloud accounts aren't configured on this deployment.")
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      writeMode(null)
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!supabase) throw new Error("Cloud accounts aren't configured on this deployment.")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || null },
          emailRedirectTo: `${window.location.origin}/journal`,
        },
      })
      if (error) throw new Error(error.message)
      writeMode(null)
      return { needsConfirmation: !data.session }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    writeMode(null)
    setUser(null)
    setMode("none")
  }, [supabase])

  const value = useMemo(
    () => ({ mode, user, supabase, startDemo, leaveDemo, signIn, signUp, signOut }),
    [mode, user, supabase, startDemo, leaveDemo, signIn, signUp, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used inside SessionProvider")
  return ctx
}
