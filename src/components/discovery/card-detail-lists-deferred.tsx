import { Suspense } from "react";

import { CardDetailLists } from "@/components/discovery/card-detail-lists";
import { prisma } from "@/lib/db";
import {
  getBuildSkeleton,
  getGameChangersInCi,
  getRoleStaplesInCi,
  getSimilarCards,
} from "@/lib/discovery/detail-pack";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import type { CardDetailView, PrintingFinish } from "@/lib/scryfall/card-printing";
import {
  buildCardDetailNavItems,
  buildCommanderDetailNavItems,
} from "@/lib/ui/detail-section-nav";

type CardDetailListsDeferredProps = {
  slug: string;
  cardId: string;
  oracleId: string;
  typeLine: string;
  isCommander: boolean;
  colorIdentity: string[];
  themes: string[];
  activeView: CardDetailView;
  setCode: string | null;
  collectorNumber: string | null;
  finish: PrintingFinish | null;
};

/**
 * Streams the lists band after the PDP hero. No fallback UI — hero stays
 * interactive while similar / relatives / commander packs resolve.
 */
export function CardDetailListsDeferred(props: CardDetailListsDeferredProps) {
  return (
    <Suspense fallback={null}>
      <CardDetailListsLoader {...props} />
    </Suspense>
  );
}

async function CardDetailListsLoader({
  slug,
  cardId,
  oracleId,
  typeLine,
  isCommander,
  colorIdentity,
  themes,
  activeView,
  setCode,
  collectorNumber,
  finish,
}: CardDetailListsDeferredProps) {
  const [relativesResult, similar, roleStaples, gameChangers, buildSkeleton] =
    await Promise.all([
      getCardRelativesBySubtype({ id: cardId, typeLine }),
      getSimilarCards(prisma, {
        oracleId,
        colorIdentity,
        themes,
      }),
      isCommander ? getRoleStaplesInCi(prisma, colorIdentity) : Promise.resolve([]),
      isCommander ? getGameChangersInCi(prisma, colorIdentity) : Promise.resolve([]),
      isCommander ? getBuildSkeleton(prisma, colorIdentity) : Promise.resolve([]),
    ]);

  const { subtypes, relatives } = relativesResult;
  const hasRelatives = subtypes.length > 0 && relatives.length > 0;
  const roleStapleNav = roleStaples
    .filter((group) => group.cards.length > 0)
    .map((group) => ({ role: group.role, label: group.label }));

  const sectionNavItems =
    activeView === "commander"
      ? buildCommanderDetailNavItems({
          roleStaples: roleStapleNav,
          hasGameChangers: gameChangers.length > 0,
          hasBuildSkeleton: buildSkeleton.length > 0,
        })
      : buildCardDetailNavItems({
          hasSimilarCards: similar.length > 0,
          hasRelatives,
        });

  return (
    <CardDetailLists
      slug={slug}
      isCommander={isCommander}
      activeView={activeView}
      setCode={setCode}
      collectorNumber={collectorNumber}
      finish={finish}
      sectionNavItems={sectionNavItems}
      similar={similar}
      subtypes={subtypes}
      relatives={relatives}
      roleStaples={roleStaples}
      gameChangers={gameChangers}
      buildSkeleton={buildSkeleton}
    />
  );
}
