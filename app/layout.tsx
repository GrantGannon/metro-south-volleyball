import type { Metadata, Viewport } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Sora } from "next/font/google";
import { TournamentProvider } from "@/components/TournamentProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import { getSnapshot } from "@/lib/snapshot";
import "./globals.css";

const bigShoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-big-shoulders", display: "swap", adjustFontFallback: false });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { info } = await getSnapshot();
  return {
    title: info.name,
    description: `Live scores, bracket, and game times for ${info.name}.`,
    applicationName: info.name,
    appleWebApp: { capable: true, title: info.shortName, statusBarStyle: "default" },
    icons: { icon: "/icons/192", apple: "/icons/180" },
  };
}

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
