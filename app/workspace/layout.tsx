import type { ReactNode } from "react";
import { AppShell } from "@toyonix/web-kit/react";

// The working area gets the whole window: no shared header or footer. Its toolbar links back
// to the home page and has the theme toggle.
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell layout="app" header={false}>
      {children}
    </AppShell>
  );
}
