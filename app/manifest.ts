import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSnapshot } from "@/lib/snapshot";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();
  const { info } = await getSnapshot();
  return {
    name: info.name,
    short_name: info.shortName,
    description: `Live scores, bracket, and game times for ${info.name}.`,
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
