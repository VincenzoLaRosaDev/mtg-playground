import type { Metadata } from "next";

import { auth } from "@/auth";
import { CreateDeckDialog } from "@/components/decks/create-deck-dialog";
import { DecksList } from "@/components/decks/decks-list";
import { DecksSignInGate } from "@/components/decks/decks-sign-in-gate";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import { listDecks } from "@/lib/decks/decks";
import { MAX_PRIVATE_DECKS } from "@/lib/decks/limits";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Decks",
  description: "Your private multi-format Magic decks.",
  path: "/decks",
  noIndex: true,
});

export default async function DecksPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return <DecksSignInGate />;
  }

  const decks = await listDecks(prisma, userId);
  const atLimit = decks.length >= MAX_PRIVATE_DECKS;

  return (
    <PageShell
      title="Decks"
      description="Private multi-format decks — build, track owned cards, save."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Decks", href: "/decks" },
      ]}
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {decks.length} / {MAX_PRIVATE_DECKS} decks
            {atLimit
              ? ` — limit reached. Delete a deck to create another.`
              : ""}
          </p>
          <CreateDeckDialog atLimit={atLimit} />
        </div>
      }
    >
      <DecksList decks={decks} />
    </PageShell>
  );
}
