import { Container, Display, Eyebrow, Lead } from "@toyonix/web-kit/react";
import { site } from "@/site";

// Placeholder until the editor lands.
export default function Home() {
  return (
    <Container>
      <section className="pt-24 pb-12">
        <Eyebrow>Coming soon</Eyebrow>
        <Display className="max-w-[15ch]">
          <em>{site.title}</em> is under construction.
        </Display>
        <Lead>{site.description}</Lead>
      </section>
    </Container>
  );
}
