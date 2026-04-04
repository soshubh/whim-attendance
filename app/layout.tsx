import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "WHIM - Attendance",
  description:
    "Self-serve attendance software with private workspaces, fixed iPhone Shortcut URLs, and a secure dashboard.",
  icons: {
    icon: "/brand/FBFLogo.png",
    shortcut: "/brand/FBFLogo.png",
    apple: "/brand/FBFLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", inter.variable)}>
      <body>{children}</body>
    </html>
  );
}
