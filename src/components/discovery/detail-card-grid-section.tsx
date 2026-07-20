import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { DetailCardLite } from "@/lib/discovery/detail-pack";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import { capitalizeLabel, roleStapleSectionId } from "@/lib/ui/detail-section-nav";

type DetailCardGridSectionProps = {
  id: string;
  title: string;
  cards: DetailCardLite[];
  emptyMessage?: string;
  uniqueToView?: boolean;
};

export function DetailCardGridSection({
  id,
  title,
  cards,
  emptyMessage = "No cards in this section yet.",
  uniqueToView = false,
}: DetailCardGridSectionProps) {
  return (
    <DetailSectionPanel id={id} title={title} uniqueToView={uniqueToView}>
      {cards.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
          {cards.map((card) => {
            const href = card.slug ? `/cards/${card.slug}` : null;
            return (
              <CardFaceTile
                key={card.id}
                href={href}
                imageUri={card.imageUri}
                faces={card.faces}
                name={card.name}
                footer={
                  <EntityPreviewFooter
                    prices={card.prices}
                    popularityRank={card.popularityRank}
                    frictionScore={card.frictionScore}
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
}: {
  groups: Array<{ role: string; label: string; cards: DetailCardLite[] }>;
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
        />
      ))}
    </>
  );
}
