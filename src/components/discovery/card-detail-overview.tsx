import type { ReactNode } from "react";

import { ClassificationBadges } from "@/components/discovery/classification-badges";
import { DetailHeroAside } from "@/components/discovery/detail-hero-aside";
import { DetailHeroMeta } from "@/components/discovery/detail-hero-meta";
import type { CardClassificationSummary } from "@/lib/discovery/detail-pack";
import type { CardFaceImage } from "@/lib/scryfall/faces";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import {
  DETAIL_HERO_GRID_CLASS,
  DETAIL_MAIN_COLUMN_CLASS,
  DETAIL_OVERVIEW_PANEL_CLASS,
} from "@/lib/ui/layout";

type CardDetailOverviewProps = {
  imageUri: string | null;
  faces?: CardFaceImage[] | null;
  imageAlt: string;
  finish: PrintingFinish;
  setName: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  versionPicker: ReactNode;
  /** Optional collection CTA under printing controls. */
  collectionAction?: ReactNode;
  previewFooter: ReactNode;
  popularityRank: number | null;
  frictionScore: number;
  isGameChanger: boolean;
  isReserved: boolean;
  isCommander: boolean;
  classification: CardClassificationSummary | null;
};

/**
 * Overview band: image column + filled details panel (status, printing, market, roles/themes).
 */
export function CardDetailOverview({
  imageUri,
  faces,
  imageAlt,
  finish,
  setName,
  setCode,
  collectorNumber,
  versionPicker,
  collectionAction,
  previewFooter,
  popularityRank,
  frictionScore,
  isGameChanger,
  isReserved,
  isCommander,
  classification,
}: CardDetailOverviewProps) {
  return (
    <section className={DETAIL_HERO_GRID_CLASS} aria-label="Card overview">
      <DetailHeroAside
        imageUri={imageUri}
        faces={faces}
        imageAlt={imageAlt}
        finish={finish}
        setName={setName}
        setCode={setCode}
        collectorNumber={collectorNumber}
      />

      <div className={DETAIL_MAIN_COLUMN_CLASS}>
        <div className={DETAIL_OVERVIEW_PANEL_CLASS}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <DetailHeroMeta
              popularityRank={popularityRank}
              frictionScore={frictionScore}
              isGameChanger={isGameChanger}
              isReserved={isReserved}
              isCommander={isCommander}
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Printing
            </p>
            <div className="mt-2 space-y-3">
              {versionPicker}
              {collectionAction}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Market
            </p>
            <div className="mt-2">{previewFooter}</div>
          </div>

          <ClassificationBadges classification={classification} />
        </div>
      </div>
    </section>
  );
}
