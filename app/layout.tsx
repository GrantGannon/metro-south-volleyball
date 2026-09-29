import type { Metadata, Viewport } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Sora } from "next/font/google";
import { TournamentProvider } from "@/components/TournamentProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import { TOURNAMENT_NAME } from "@/lib/format";
import { getSnapshot } from "@/lib/snapshot";
import "./globals.css";

const bigShoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-big-shoulders", display: "swap", adjustFontFallback: false });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TOURNAMENT_NAME,
  description: "Live scores, bracket, and game times for the Metro-South 8th Grade Girls Volleyball tournament.",
  applicationName: TOURNAMENT_NAME,
  appleWebApp: { capable: true, title: "Metro-South", statusBarStyle: "default" },
  icons: { icon: "/icons/192", apple: "/icons/180" },
};

export const viewport: Viewport = {
  themeColor: "#B7D0E8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getSnapshot();
  return (
    <html lang="en" className={`${bigShoulders.variable} ${sora.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <TournamentProvider initial={snapshot}>{children}</TournamentProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
