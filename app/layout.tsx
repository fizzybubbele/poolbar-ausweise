import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";
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
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider enabled={authEnabled}>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
