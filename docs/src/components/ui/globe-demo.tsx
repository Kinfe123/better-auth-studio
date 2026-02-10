"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import type { GlobeConfig, GlobeCountries } from "./globe";

const World = dynamic(() => import("./globe").then((m) => m.World), { ssr: false });

const GLOBE_JSON_URL = "/globe.json";

const GRAYSCALE_COLORS = ["#888888", "#aaaaaa", "#cccccc", "#ffffff", "#666666", "#999999"];

const SAMPLE_ARCS = [
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -22.9068,
    endLng: -43.1729,
    arcAlt: 0.1,
    color: GRAYSCALE_COLORS[0],
  },
  {
    order: 1,
    startLat: 28.6139,
    startLng: 77.209,
    endLat: 3.139,
    endLng: 101.6869,
    arcAlt: 0.2,
    color: GRAYSCALE_COLORS[1],
  },
  {
    order: 1,
    startLat: -19.885592,
    startLng: -43.951191,
    endLat: -1.303396,
    endLng: 36.852443,
    arcAlt: 0.5,
    color: GRAYSCALE_COLORS[2],
  },
  {
    order: 2,
    startLat: 1.3521,
    startLng: 103.8198,
    endLat: 35.6762,
    endLng: 139.6503,
    arcAlt: 0.2,
    color: GRAYSCALE_COLORS[3],
  },
  {
    order: 2,
    startLat: 51.5072,
    startLng: -0.1276,
    endLat: 3.139,
    endLng: 101.6869,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[0],
  },
  {
    order: 2,
    startLat: -15.785493,
    startLng: -47.909029,
    endLat: 36.162809,
    endLng: -115.119411,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[1],
  },
  {
    order: 3,
    startLat: -33.8688,
    startLng: 151.2093,
    endLat: 22.3193,
    endLng: 114.1694,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[2],
  },
  {
    order: 3,
    startLat: 21.3099,
    startLng: -157.8581,
    endLat: 40.7128,
    endLng: -74.006,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[3],
  },
  {
    order: 3,
    startLat: -6.2088,
    startLng: 106.8456,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[0],
  },
  {
    order: 4,
    startLat: 34.0522,
    startLng: -118.2437,
    endLat: 31.2304,
    endLng: 121.4737,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[1],
  },
  {
    order: 4,
    startLat: 22.3193,
    startLng: 114.1694,
    endLat: 51.5072,
    endLng: -0.1276,
    arcAlt: 0.3,
    color: GRAYSCALE_COLORS[2],
  },
  {
    order: 5,
    startLat: 40.7128,
    startLng: -74.006,
    endLat: 48.8566,
    endLng: 2.3522,
    arcAlt: 0.2,
    color: GRAYSCALE_COLORS[3],
  },
];

const globeConfig: GlobeConfig = {
  pointSize: 4,
  globeColor: "#0d0d0d",
  showAtmosphere: true,
  atmosphereColor: "#ffffff",
  atmosphereAltitude: 0.1,
  emissive: "#000000",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(240,240,240,0.95)",
  ambientLight: "#ffffff",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3193, lng: 114.1694 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

interface GlobeDemoProps {
  compact?: boolean;
  /** When true, use transparent background so a wave/pattern behind shows through. */
  transparentBg?: boolean;
}

export function GlobeDemo({ compact = false, transparentBg = false }: GlobeDemoProps) {
  const [countries, setCountries] = useState<GlobeCountries | null>(null);

  useEffect(() => {
    fetch(GLOBE_JSON_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: GlobeCountries) => setCountries(data))
      .catch(() =>
        fetch("https://assets.aceternity.com/globe.json")
          .then((r) => r.json())
          .then((data: GlobeCountries) => setCountries(data))
          .catch(() => setCountries(null)),
      );
  }, []);

  return (
    <div
      className={`w-full h-full relative ${transparentBg ? "bg-transparent" : "bg-[#0a0a0a]"} ${compact ? "min-h-0" : "min-h-[380px]"}`}
      style={compact ? undefined : { minHeight: "55vh" }}
    >
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <World data={SAMPLE_ARCS} globeConfig={globeConfig} countries={countries} />
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
    </div>
  );
}
