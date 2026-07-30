"use client";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { DetailCardLite } from "@/lib/discovery/detail-pack";
import { cardFaceDetailGridClass } from "@/lib/ui/card-face";
import { capitalizeLabel, roleStapleSectionId } from "@/lib/ui/detail-section-nav";

type DetailCardGridSectionProps = {
  id: string;
  title: string;
  cards: DetailCardLite[];
  emptyMessage?: string;
  uniqueToView?: boolean;
  /** Full-width lists band (no sticky TOC) — denser columns from `lg`. */
  wideGrid?: boolean;
};

export function DetailCardGridSection({
  id,
  title,
  cards,
  emptyMessage = "No cards in this section yet.",
  uniqueToView = false,
  wideGrid = false,
}: DetailCardGridSectionProps) {
  const { openCardDetail } = useCardDetailModal();

  return (
    <DetailSectionPanel id={id} title={title} uniqueToView={uniqueToView}>
      {cards.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className={`mt-4 ${cardFaceDetailGridClass(wideGrid)}`}>
          {cards.map((card) => {
            const href = card.slug ? `/cards/${card.slug}` : null;
            return (
              <CardFaceTile
                key={card.id}
                href={href}
                onOpen={
                  card.slug || card.id
                    ? () =>
                        openCardDetail({
                          mode: "collection",
                          slug: card.slug ?? undefined,
                          cardId: card.id,
                          imageUri: card.imageUri,
                          faces: card.faces,
                        })
                    : undefined
                }
                imageUri={card.imageUri}
                faces={card.faces}
                name={card.name}
                footer={
                  <EntityPreviewFooter
                    prices={card.prices}
                    popularityRank={card.popularityRank}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </DetailSectionPanel>
  );
}

export function RoleStaplesSection({
  groups,
  wideGrid = false,
}: {
  groups: Array<{ role: string; label: string; cards: DetailCardLite[] }>;
  wideGrid?: boolean;
}) {
  const nonEmpty = groups.filter((group) => group.cards.length > 0);
  if (nonEmpty.length === 0) {
    return null;
  }

  return (
    <>
      {nonEmpty.map((group) => (
        <DetailCardGridSection
          key={group.role}
          id={roleStapleSectionId(group.role)}
          title={capitalizeLabel(group.label)}
          cards={group.cards}
          wideGrid={wideGrid}
        />
      ))}
    </>
  );
}
