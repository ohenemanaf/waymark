"use client"

import { useState } from "react"
import { LocateFixed, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const EXPLAINED_KEY = "waymark:location-explained"

type Coords = { latitude: number; longitude: number }

const messages: Record<number, string> = {
  1: "Location access is blocked for this site. You can allow it in your browser settings, or search or type the place instead.",
  2: "Your device couldn't work out where you are. Try again outdoors, or search or type the place instead.",
  3: "Finding your location took too long. Try again, or search or type the place instead.",
}

/**
 * Asks for location only after the person chooses it, and explains why first.
 */
export function CurrentLocationButton({
  onLocated,
  onError,
}: {
  onLocated: (c: Coords) => Promise<void> | void
  onError: (message: string) => void
}) {
  const [explainOpen, setExplainOpen] = useState(false)
  const [locating, setLocating] = useState(false)

  const locate = () => {
    if (!("geolocation" in navigator)) {
      onError("This browser can't share your location. Search or type the place instead.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await onLocated({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        onError(messages[err.code] ?? "We couldn't get your location.")
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }

  const onClick = () => {
    let explained = false
    try {
      explained = localStorage.getItem(EXPLAINED_KEY) === "1"
    } catch {}
    if (explained) locate()
    else setExplainOpen(true)
  }

  return (
    <>
      <Button type="button" variant="outline" className="h-10 px-4" onClick={onClick} disabled={locating}>
        {locating ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <LocateFixed data-icon="inline-start" />}
        {locating ? "Finding you…" : "Use my location"}
      </Button>
      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use your current location?</DialogTitle>
            <DialogDescription>
              Waymark checks your location once, right now, to fill in the place you&apos;re at. It isn&apos;t tracked in
              the background. Only the coordinates of the place you save are stored, and you can change or clear them
              before saving.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Your browser will ask for permission next.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExplainOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                try {
                  localStorage.setItem(EXPLAINED_KEY, "1")
                } catch {}
                setExplainOpen(false)
                locate()
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
