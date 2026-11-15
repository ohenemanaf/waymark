import type { MetadataRoute } from "next"

/** Lets Waymark be added to a phone's home screen and open like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Waymark",
    short_name: "Waymark",
    description: "A private journal for the places you've been.",
    start_url: "/journal",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#f4f5f7",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
