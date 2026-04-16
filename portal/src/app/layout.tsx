// portal/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // adjust path if your CSS file differs

export const metadata: Metadata = {
  title: 'GeoCollect Portal',
  description: 'GeoCollect data collection portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
