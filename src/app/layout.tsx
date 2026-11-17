import type { Metadata, Viewport } from "next";
import { Outfit, Sora } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SidebarProvider } from "@/context/SidebarContext";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "SIGEP",
  description: "Système de gestion des employés — SNIESM",
  manifest: "/manifest.json",
  icons: {
    icon: ["/icon-192.png", "/icon-512.png"],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#465FFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${outfit.className} ${sora.variable} min-h-full`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </QueryProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
