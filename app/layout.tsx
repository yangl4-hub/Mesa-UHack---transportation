import type { Metadata } from "next";
import "./globals.css";
import { ParkingProvider } from '@/components/parkwatch/provider';
import { Shell } from '@/components/parkwatch/shell';
import { getSnapshot } from '@/lib/parking/mock-service';

export const metadata: Metadata = {
  title: "ParkWatch | Smart Campus Parking",
  description: "Find campus parking, track your parking time, and explore simulated AI vehicle monitoring with ParkWatch.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><a className="skip-link" href="#main">Skip to content</a><ParkingProvider initial={getSnapshot()}><Shell>{children}</Shell></ParkingProvider></body>
    </html>
  );
}
