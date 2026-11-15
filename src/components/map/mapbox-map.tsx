"use client"

import { useEffect, useRef, useState } from "react"
import type { GeoJSONSource, Map as MapboxMapType } from "mapbox-gl"
import type { FeatureCollection, Point } from "geojson"
import "mapbox-gl/dist/mapbox-gl.css"
import type { Memory } from "@/lib/types"
import { config } from "@/lib/config"
import { boundsOf, type LngLat } from "@/lib/geo"

type Props = {
  memories: (Memory & LngLat)[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onError: (message: string) => void
  compact?: boolean
  insetLeft?: number
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function toGeoJSON(memories: (Memory & LngLat)[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: memories.map((m) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
      properties: { id: m.id, name: m.placeName },
    })),
  }
}

function fit(map: MapboxMapType, memories: LngLat[], animate: boolean, insetLeft = 0) {
  const b = boundsOf(memories)
  if (!b) return
  if (b.west === b.east && b.south === b.north) {
    map.jumpTo({ center: [b.west, b.south], zoom: 12 })
    return
  }
  map.fitBounds(
    [
      [b.west, b.south],
      [b.east, b.north],
    ],
    { padding: { top: 48, right: 48, bottom: 48, left: 48 + insetLeft }, maxZoom: 13, duration: animate && !reducedMotion() ? 600 : 0 },
  )
}

export function MapboxMap({ memories, selectedId, onSelect, onError, compact, insetLeft = 0 }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMapType | null>(null)
  const [ready, setReady] = useState(false)
  const latest = useRef({ memories, onSelect, onError, insetLeft })
  useEffect(() => {
    latest.current = { memories, onSelect, onError, insetLeft }
  })

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | undefined
    import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (cancelled || !container.current) return
        mapboxgl.accessToken = config.mapboxToken
        const map = new mapboxgl.Map({
          container: container.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [0, 25],
          zoom: 1.2,
          interactive: !compact,
          attributionControl: !compact,
        })
        mapRef.current = map
        if (!compact) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
        observer = new ResizeObserver(() => map.resize())
        observer.observe(container.current)

        map.on("error", (e) => {
          if (!map.loaded()) latest.current.onError(e.error?.message ?? "The map couldn't load.")
        })

        map.on("load", () => {
          map.addSource("memories", {
            type: "geojson",
            data: toGeoJSON(latest.current.memories),
            cluster: true,
            clusterRadius: 44,
            clusterMaxZoom: 13,
          })
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "memories",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#16181d",
              "circle-radius": ["step", ["get", "point_count"], 15, 5, 19, 15, 24],
              "circle-stroke-width": 3,
              "circle-stroke-color": "rgba(255,255,255,0.9)",
            },
          })
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "memories",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"] },
            paint: { "text-color": "#ffffff" },
          })
          map.addLayer({
            id: "points",
            type: "circle",
            source: "memories",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": "#0f7b8a",
              "circle-radius": 7,
              "circle-stroke-width": 2.5,
              "circle-stroke-color": "#ffffff",
            },
          })
          map.addLayer({
            id: "selected",
            type: "circle",
            source: "memories",
            filter: ["==", ["get", "id"], ""],
            paint: {
              "circle-color": "#16181d",
              "circle-radius": 9,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          })

          map.on("click", "clusters", (e) => {
            const feature = e.features?.[0]
            if (!feature) return
            const source = map.getSource("memories") as GeoJSONSource
            source.getClusterExpansionZoom(feature.properties?.cluster_id, (err, zoom) => {
              if (err || zoom == null) return
              const [lng, lat] = (feature.geometry as Point).coordinates
              map.easeTo({ center: [lng, lat], zoom, duration: reducedMotion() ? 0 : 500 })
            })
          })
          map.on("click", "points", (e) => {
            const id = e.features?.[0]?.properties?.id as string | undefined
            if (id) latest.current.onSelect(id)
          })
          map.on("click", (e) => {
            const hits = map.queryRenderedFeatures(e.point, { layers: ["points", "clusters"] })
            if (!hits.length) latest.current.onSelect(null)
          })
          for (const layer of ["clusters", "points"]) {
            map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"))
            map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""))
          }

          fit(map, latest.current.memories, false, latest.current.insetLeft)
          setReady(true)
        })
      })
      .catch(() => latest.current.onError("The map library couldn't load."))

    return () => {
      cancelled = true
      observer?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [compact])

  // Keep the data in sync with the current memory list.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource("memories") as GeoJSONSource | undefined)?.setData(toGeoJSON(memories))
    fit(map, memories, true, insetLeft)
  }, [memories, ready, insetLeft])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setFilter("selected", ["==", ["get", "id"], selectedId ?? ""])
    const m = memories.find((x) => x.id === selectedId)
    if (m && !map.getBounds()?.contains([m.longitude, m.latitude])) {
      map.easeTo({ center: [m.longitude, m.latitude], duration: reducedMotion() ? 0 : 500 })
    }
  }, [selectedId, memories, ready])

  return (
    <div className="relative size-full">
      <div ref={container} className="size-full" role="region" aria-label={`Map showing ${memories.length} memories`} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/70 text-[13px] text-muted-foreground" role="status">
          Loading map…
        </div>
      )}
    </div>
  )
}
