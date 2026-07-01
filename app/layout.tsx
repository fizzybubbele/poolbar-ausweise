import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { isAuthEnabled } from "@/lib/auth/users";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poolbar Ausweis-Generator",
  description: "Automatische Erstellung von MA- und BL-Ausweisen",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authEnabled = isAuthEnabled();

  return (
    <html lang="de">
      <body className="antialiased min-h-screen">
        <AuthProvider enabled={authEnabled}>{children}</AuthProvider>
      </body>
    </html>
  );
}
