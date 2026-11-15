import type { Metadata, Viewport } from "next"
import { Instrument_Serif, Manrope } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

// Manrope for the interface; Instrument Serif for titles and journal notes only.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] })
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: { default: "Waymark — a private travel journal", template: "%s — Waymark" },
  description: "Save the places you've been in seconds, then find them again on a map, in your journal, or by trip.",
}

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrument.variable} h-full`}>
      <body className="min-h-full text-[14px] leading-[1.5] text-foreground">
        <SessionProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SessionProvider>
        <Toaster
          theme="light"
          position="top-center"
          closeButton
          toastOptions={{ classNames: { toast: "glass-strong !rounded-2xl !border-0 !text-[13px] !font-sans" } }}
        />
      </body>
    </html>
  )
}
