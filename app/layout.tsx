import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkWatch | Campus parking",
  description: "Find a space, watch your parking timer, and explore campus parking image analysis.",
  other: {
    "codex-preview": "development",
  },
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
