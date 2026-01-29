import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TownyFaiths - Religion System for Towny Servers",
  description: "Bring immersive faith mechanics to your Minecraft server. Create religions, build temples, gain followers, and unlock divine powers with TownyFaiths.",
  keywords: ["Minecraft", "Towny", "Plugin", "Religion", "Faith", "Spigot", "Paper"],
  authors: [{ name: "Pablo Blanco", url: "https://blancocl.vercel.app" }],
  openGraph: {
    title: "TownyFaiths - Religion System for Towny Servers",
    description: "Bring immersive faith mechanics to your Minecraft server. Create religions, build temples, gain followers, and unlock divine powers.",
    type: "website",
    url: "https://townyfaiths.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "TownyFaiths - Religion System for Towny Servers",
    description: "Bring immersive faith mechanics to your Minecraft server.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
