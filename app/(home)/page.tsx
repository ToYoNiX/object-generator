import Link from "next/link";
import {
  Button,
  ButtonRow,
  Card,
  CardBody,
  CardCta,
  CardGrid,
  CardMeta,
  CardTitle,
  CardTop,
  Container,
  Display,
  Eyebrow,
  Lead,
  Section,
  SectionLabel,
} from "@toyonix/web-kit/react";
import { ergogenEngine } from "@/engines/ergogen";

const engine = ergogenEngine;

const STEPS = [
  {
    meta: "01 · config",
    title: "Write it, or start from an example",
    body: "The YAML config is the source of truth. Start a new object, or open an example and change it.",
  },
  {
    meta: "02 · generate",
    title: "See every file it makes",
    body: "Outlines, PCBs and cases are generated in your browser as you type. Nothing is uploaded.",
  },
  {
    meta: "03 · export",
    title: "Download what you need",
    body: "One file, or a zip of everything with the config that made it.",
  },
];

export default function Home() {
  return (
    <Container>
      <section className="pt-24 pb-16">
        <Eyebrow>beta · keyboards first</Eyebrow>
        <Display className="max-w-[16ch]">
          Make <em>objects</em> in your browser.
        </Display>
        <Lead>
          Shape them with the mouse or write their config, then download the real files: outlines, PCBs and
          cases, ready to cut, order or print.
        </Lead>
        <ButtonRow>
          <Button asChild>
            <Link href="/workspace/">Continue your draft</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/workspace/?new">New object</Link>
          </Button>
        </ButtonRow>
        <p className="mt-4 text-sm text-text-muted">
          Your draft is kept in this browser, so you can close the tab and pick up where you left off. There
          is one draft for now: starting a new object or opening an example replaces it (you&apos;re asked
          first if it has your changes).
        </p>
      </section>

      <Section>
        <SectionLabel>Start</SectionLabel>
        <CardGrid>
          <Card asChild>
            <Link href="/workspace/?new">
              <CardTop>
                <CardMeta>new</CardMeta>
              </CardTop>
              <CardTitle>A new object</CardTitle>
              <CardBody>A small commented starter: a 2 × 2 grid of keys and the board around them.</CardBody>
              <CardCta>Start →</CardCta>
            </Link>
          </Card>
          {engine.examples.map((example) => (
            <Card key={example.id} asChild>
              <Link href={`/workspace/?example=${encodeURIComponent(example.id)}`}>
                <CardTop>
                  <CardMeta>example · by {example.author}</CardMeta>
                </CardTop>
                <CardTitle>{example.label}</CardTitle>
                {example.description ? <CardBody>{example.description}</CardBody> : null}
                <CardCta>Open →</CardCta>
              </Link>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Section>
        <SectionLabel>How it works</SectionLabel>
        <CardGrid>
          {STEPS.map((step) => (
            <Card key={step.meta}>
              <CardTop>
                <CardMeta>{step.meta}</CardMeta>
              </CardTop>
              <CardTitle>{step.title}</CardTitle>
              <CardBody>{step.body}</CardBody>
            </Card>
          ))}
        </CardGrid>
      </Section>
    </Container>
  );
}
