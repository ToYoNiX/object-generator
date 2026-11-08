import type { ReactNode } from "react";
import { AppShell } from "@toyonix/web-kit/react";
import { getRegistrySnapshot } from "@toyonix/web-kit/registry";
import { site } from "@/site";

export default async function HomeLayout({ children }: { children: ReactNode }) {
  // Fetched once at build time so the shared nav is in the static HTML.
  const registry = await getRegistrySnapshot();
  return (
    <AppShell registry={registry} appTitle={site.title} appNav={site.nav}>
      {children}
    </AppShell>
  );
}
