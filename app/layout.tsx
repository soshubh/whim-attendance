import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

import "./foundation.css";

export const metadata: Metadata = {
  title: "WHIM - Attendance",
  description:
    "Self-serve attendance software with private workspaces, fixed iPhone Shortcut URLs, and a secure dashboard.",
  icons: {
    icon: "/brand/FBFLogo-OR.png",
    shortcut: "/brand/FBFLogo-OR.png",
    apple: "/brand/FBFLogo-OR.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
