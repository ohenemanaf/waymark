"use client"

/** Last-resort error screen for failures in the root layout itself. Uses inline styles because global CSS may not have loaded. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f4f5f7", color: "#16181d", fontFamily: "system-ui, sans-serif" }}>
        <main role="alert" style={{ maxWidth: 360, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Waymark couldn&apos;t load</h1>
          <p style={{ fontSize: 14, color: "#6b7079", lineHeight: 1.5 }}>Something went wrong while starting the app. Your saved memories aren&apos;t affected.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 8, height: 40, padding: "0 20px", borderRadius: 999, border: 0, background: "#16181d", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
