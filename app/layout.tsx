import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeScript } from "@toyonix/web-kit/react";
import { site } from "@/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${site.title} · toyonix`, template: `%s · ${site.title} · toyonix` },
  description: site.description,
};

// The AppShell lives in each route group's layout: (home) is a normal page with the shared
// header, workspace/ is a full-window tool page without it.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
