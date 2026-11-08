import Link from "next/link";
import { AppShell, Button, ButtonRow, Container, Display, Lead } from "@toyonix/web-kit/react";
import { getRegistrySnapshot } from "@toyonix/web-kit/registry";
import { site } from "@/site";

// Rendered by the root layout, which has no AppShell (the route groups bring their own).
export default async function NotFound() {
  const registry = await getRegistrySnapshot();
  return (
    <AppShell registry={registry} appTitle={site.title} appNav={site.nav}>
      <Container>
        <section className="pt-24 pb-16">
          <Display>
            Page <em>not found</em>.
          </Display>
          <Lead>This page doesn&apos;t exist, or it moved.</Lead>
          <ButtonRow>
            <Button asChild>
              <Link href="/">Back to the start</Link>
            </Button>
          </ButtonRow>
        </section>
      </Container>
    </AppShell>
  );
}
