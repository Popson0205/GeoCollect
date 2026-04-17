import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "GeoCollect Portal", description: "Open-architecture geospatial data collection platform" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
