import type { Metadata } from "next";
import localFont from "next/font/local";
import Navigation from "@/components/Navigation";
import "./globals.css";

const sans = localFont({
  src: [
    {
      path: "./fonts/GeistVF.woff2",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

const mono = localFont({
  src: [
    {
      path: "./fonts/GeistMonoVF.woff2",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  title: "Warehouse 10U Command Center",
  description: "Team management for Warehouse 10U travel baseball",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} antialiased bg-slate-50 text-slate-800 font-sans`}
      >
        <Navigation />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
