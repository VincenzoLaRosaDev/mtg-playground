import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { DeckEditor } from "@/components/decks/deck-editor";
import { DecksSignInGate } from "@/components/decks/decks-sign-in-gate";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import { getDeckDetail } from "@/lib/decks/decks";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

type DeckEditorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DeckEditorPageProps): Promise<Metadata> {
  const { id } = await params;
  return createPageMetadata({
    title: "Deck",
    description: "Edit your private multi-format deck.",
    path: `/decks/${id}`,
    noIndex: true,
  });
}

export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await params;

  if (!userId) {
    return <DecksSignInGate callbackUrl={`/decks/${id}`} />;
  }

  const deck = await getDeckDetail(prisma, userId, id);
  if (!deck) notFound();

  return (
    <PageShell
      title={deck.name}
      description="Live editor — add cards, pick printings, track owned vs missing."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Decks", href: "/decks" },
        { label: deck.name, href: `/decks/${deck.id}` },
      ]}
    >
      <DeckEditor deck={deck} />
    </PageShell>
  );
}
