import Link from "next/link";
import { Button, ButtonRow, Container, Display, Lead } from "@toyonix/web-kit/react";

export default function NotFound() {
  return (
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
  );
}
