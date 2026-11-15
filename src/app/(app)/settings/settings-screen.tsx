"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Download, Loader2, LogOut, RotateCcw, ShieldCheck, Trash2 } from "lucide-react"
import { useData } from "@/components/providers/data-provider"
import { useSession } from "@/components/providers/session-provider"
import { ModeBadge } from "@/components/app-shell"
import { PageContainer, PageTitle } from "@/components/page"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatDate, plural } from "@/lib/format"
import { config } from "@/lib/config"

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/\W+/g, "-")
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="px-1 text-[15px]">{title}</h2>
      {description && <p className="mt-0.5 px-1 text-[13px] text-muted-foreground">{description}</p>}
      <div className="surface mt-3 rounded-2xl p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function SettingsScreen() {
  const { kind, profile, memories, trips, updateProfile, exportData, deleteAllData } = useData()
  const { signOut, leaveDemo } = useSession()
  const router = useRouter()
  const [name, setName] = useState(profile?.displayName ?? "")
  const [savingName, setSavingName] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deletingAll, setDeletingAll] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const demo = kind === "demo"
  const photoCount = memories.filter((m) => m.photoPath).length

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    try {
      await updateProfile({ displayName: name.trim().slice(0, 60) || null })
      toast.success("Name updated")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingName(false)
    }
  }

  const deleteEverything = async () => {
    setDeletingAll(true)
    try {
      await deleteAllData()
      if (demo) await leaveDemo()
      toast.success(demo ? "Demo data deleted" : "Your account and all its data have been deleted")
      router.replace("/")
    } catch (e) {
      toast.error((e as Error).message)
      setDeletingAll(false)
    }
  }

  return (
    <PageContainer className="max-w-2xl space-y-9">
      <header>
        <PageTitle>Settings</PageTitle>
        <ModeBadge className="mt-2" />
      </header>

      {demo && (
        <div className="glass rounded-2xl p-4 text-[13px]">
          <p className="text-[14px] font-semibold">You&apos;re using the demo</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Everything you add is saved only in this browser, on this device. Nothing is uploaded, and clearing your
            browser data will erase it.
            {config.hasSupabase ? " Create an account to keep a private journal in the cloud." : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {config.hasSupabase && (
              <Button size="sm" className="px-3.5" onClick={async () => { await leaveDemo(); router.push("/auth?mode=sign-up") }}>
                Create an account
              </Button>
            )}
            <Button size="sm" variant="outline" className="px-3.5" onClick={() => setConfirmReset(true)}>
              <RotateCcw data-icon="inline-start" /> Reset sample data
            </Button>
            <Button size="sm" variant="ghost" className="px-3.5" onClick={async () => { await leaveDemo(); router.push("/") }}>
              Leave demo
            </Button>
          </div>
        </div>
      )}

      <Section title="Profile">
        <form onSubmit={saveName} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input id="display-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="Used in your greeting" />
          </div>
          <Button type="submit" variant="outline" className="h-9 px-4" disabled={savingName || name === (profile?.displayName ?? "")}>
            {savingName && <Loader2 className="animate-spin" data-icon="inline-start" />} Save
          </Button>
        </form>
        <dl className="mt-5 grid grid-cols-2 gap-y-1.5 border-t border-hairline pt-4 text-[13px]">
          {profile?.email && (
            <>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">{profile.email}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Journal started</dt>
          <dd>{profile ? formatDate(profile.createdAt.slice(0, 10), "short") : "—"}</dd>
          <dt className="text-muted-foreground">Saved</dt>
          <dd>{plural(memories.length, "memory", "memories")}, {plural(trips.length, "trip")}</dd>
        </dl>
      </Section>

      <Section title="Privacy" description="Waymark is private by default. There are no public profiles, followers or feeds.">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="approx" className="text-[14px] font-semibold">Save approximate locations</Label>
            <p id="approx-desc" className="mt-0.5 text-[13px] text-muted-foreground">
              Round new and edited map pins to about 1 km, so a memory never pinpoints an exact address such as a home.
            </p>
          </div>
          <Switch
            id="approx"
            aria-describedby="approx-desc"
            checked={profile?.approximateLocation ?? false}
            onCheckedChange={async (checked) => {
              try {
                await updateProfile({ approximateLocation: checked })
                toast.success(checked ? "New pins will be approximate" : "New pins will be exact")
              } catch (e) {
                toast.error((e as Error).message)
              }
            }}
          />
        </div>

        <div className="mt-5 border-t border-hairline pt-4 text-[13px]">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[14px]">
            <ShieldCheck className="size-4 text-brand" strokeWidth={1.8} aria-hidden /> What Waymark stores
          </h3>
          <ul className="space-y-2.5 leading-relaxed text-muted-foreground">
            <li>
              <strong className="font-semibold text-foreground">Location:</strong> only the place name, address and
              coordinates you save with a memory. Your device location is read once, and only when you tap &ldquo;Use my
              location&rdquo;. It is never tracked in the background.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Photos:</strong>{" "}
              {demo
                ? "kept in this browser's storage."
                : "kept in private storage that only your account can read. They are shown through short-lived links."}{" "}
              Photos are resized and re-encoded before saving, which strips embedded camera data such as GPS where the
              browser supports the format.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Account:</strong>{" "}
              {demo ? "none — the demo has no account." : "your email address and display name."} No analytics or
              advertising trackers.
            </li>
          </ul>
        </div>
      </Section>

      <Section title="Your data" description="Take your journal with you, or remove it completely.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 px-4" onClick={exportData}>
            <Download data-icon="inline-start" /> Export as JSON
          </Button>
          {!demo && (
            <Button variant="outline" className="h-9 px-4" onClick={async () => { await signOut(); router.replace("/") }}>
              <LogOut data-icon="inline-start" /> Sign out
            </Button>
          )}
        </div>
        <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">
          The export includes your profile, trips and memories with their notes, dates, tags and locations. Photo files
          are referenced by their storage path.
        </p>

        <div className="mt-5 border-t border-hairline pt-4">
          <h3 className="text-[14px] text-destructive">{demo ? "Delete demo data" : "Delete account"}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {demo
              ? "Removes every sample and added memory, trip and photo from this browser and leaves the demo."
              : `Permanently deletes your account, ${plural(memories.length, "memory", "memories")}, ${plural(trips.length, "trip")} and ${plural(photoCount, "photo")}. This can't be undone, so export first if you want a copy.`}
          </p>
          <Button variant="destructive" className="mt-3.5 h-9 px-4" onClick={() => setConfirmDelete(true)} disabled={deletingAll}>
            {deletingAll ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
            {demo ? "Delete demo data" : "Delete my account"}
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => {
          setConfirmDelete(o)
          if (!o) setConfirmText("")
        }}
        title={demo ? "Delete all demo data?" : "Delete your account for good?"}
        description={
          demo
            ? "Everything in the demo will be erased from this browser."
            : "Your photos are deleted first, then your account and every memory and trip. You'll be signed out."
        }
        confirmLabel={demo ? "Delete demo data" : "Delete account"}
        destructive
        disabled={!demo && confirmText !== "DELETE"}
        onConfirm={deleteEverything}
      >
        {!demo && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type <strong>DELETE</strong> to confirm
            </Label>
            <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className="h-9" />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the sample data?"
        description="Your demo changes will be replaced with the original sample memories and trips."
        confirmLabel="Reset"
        onConfirm={async () => {
          await deleteAllData()
          window.location.reload()
        }}
      />
    </PageContainer>
  )
}
