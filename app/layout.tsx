import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poolbar Ausweis-Generator",
  description: "Automatische Erstellung von MA- und BL-Ausweisen",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
