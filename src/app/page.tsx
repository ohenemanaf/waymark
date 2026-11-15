import Image from "next/image"
import Link from "next/link"
import { Logo } from "@/components/brand"
import { seedPhotoCredits } from "@/lib/data/seed"
import { LandingActions } from "./landing-actions"

const scenes = [
  { place: "Fairy Pools, Skye", date: "July 2025", photo: "/demo/fairy.jpg" },
  { place: "Arashiyama, Kyoto", date: "November 2025", photo: "/demo/arashiyama.jpg" },
  { place: "Pena Palace, Sintra", date: "April 2026", photo: "/demo/pena.jpg" },
  { place: "Jardin Majorelle", date: "March 2025", photo: "/demo/majorelle.jpg" },
  { place: "Kakum, Ghana", date: "August 2026", photo: "/demo/kakum.jpg" },
]

const promises = [
  { title: "Saved in seconds", text: "A place and a photo is a whole memory. Notes, dates and tags can wait until you're home." },
  { title: "Found again three ways", text: "Scroll your journal, wander your own map, or open a trip and relive it in order." },
  { title: "Yours alone", text: "No profiles, followers or likes. Nothing you save is shown to anyone else." },
]

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/auth" className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-foreground/80 hover:bg-black/[0.04] hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
          <h1 className="text-[42px] leading-[1.02] sm:text-[64px]">Keep the places that stayed with you.</h1>
          <p className="mx-auto mt-5 max-w-[34rem] text-[16px] leading-relaxed text-muted-foreground">
            Waymark is a private journal for where you&apos;ve been. Pin a place and a photo while you&apos;re there, then
            come back to it on a map, in your journal, or as part of a trip.
          </p>
          <LandingActions />
        </section>

        {/* The photos carry the colour; captions sit on glass over them. */}
        <section aria-label="Sample memories" className="pb-20">
          <ul className="no-scrollbar mx-auto flex max-w-6xl snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-6">
            {scenes.map((s, i) => (
              <li
                key={s.place}
                className={`relative w-[68%] shrink-0 snap-center overflow-hidden rounded-[22px] sm:w-auto ${i === 2 ? "sm:-mt-6" : i % 2 ? "sm:mt-6" : ""}`}
              >
                <Image
                  src={s.photo}
                  alt={`Photo of ${s.place}`}
                  width={600}
                  height={800}
                  sizes="(min-width: 640px) 20vw, 68vw"
                  priority={i === 2}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="glass-dark absolute inset-x-2 bottom-2 rounded-2xl px-3 py-2 text-left">
                  <p className="truncate text-[13px] font-semibold">{s.place}</p>
                  <p className="text-[11px] text-white/80">{s.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="What Waymark does" className="mx-auto max-w-5xl border-t border-hairline px-4 py-14 sm:px-6">
          <ul className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {promises.map((p) => (
              <li key={p.title}>
                <h2 className="text-[15px]">{p.title}</h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <details className="text-[11px] text-muted-foreground">
          <summary className="cursor-pointer rounded-full py-1 font-medium hover:text-foreground">Photo credits</summary>
          <ul className="mt-2 space-y-0.5">
            {scenes.map((s) => {
              const c = seedPhotoCredits[s.photo]
              return (
                <li key={s.photo}>
                  {s.place}:{" "}
                  <a href={c.source} className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noreferrer">
                    {c.author}
                  </a>
                  , {c.license}, via Wikimedia Commons
                </li>
              )
            })}
          </ul>
        </details>
      </footer>
    </div>
  )
}
