import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MinePlugins - Paper 1.21 Plugin Store",
  description: "Official store for Minecraft Paper 1.21 plugins with secure licensing, instant downloads, and updates.",
  keywords: ["Minecraft", "Paper 1.21", "Plugin", "Store", "Licenses", "Spigot", "Paper"],
  authors: [{ name: "Pablo Blanco", url: "https://blancocl.vercel.app" }],
  openGraph: {
    title: "MinePlugins - Paper 1.21 Plugin Store",
    description: "Official store for Minecraft Paper 1.21 plugins with secure licensing, instant downloads, and updates.",
    type: "website",
    url: "https://mineplugins.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "MinePlugins - Paper 1.21 Plugin Store",
    description: "Official store for Minecraft Paper 1.21 plugins with secure licensing and instant downloads.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
