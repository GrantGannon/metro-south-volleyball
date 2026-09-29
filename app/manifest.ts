import type { MetadataRoute } from "next";
import { TOURNAMENT_NAME } from "@/lib/format";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: TOURNAMENT_NAME,
    short_name: "Metro-South",
    description: "Live scores, bracket, and game times.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#B7D0E8",
    theme_color: "#B7D0E8",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
