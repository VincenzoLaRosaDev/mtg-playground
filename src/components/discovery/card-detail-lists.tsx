import { BuildSkeletonSection } from "@/components/discovery/build-skeleton-section";
import { CardDetailViewToggle } from "@/components/discovery/card-detail-view-toggle";
import { CardRelativesBySubtype } from "@/components/discovery/card-relatives-by-subtype";
import {
  DetailCardGridSection,
  RoleStaplesSection,
} from "@/components/discovery/detail-card-grid-section";
import { DetailSectionJump } from "@/components/discovery/detail-section-jump";
import { DetailSectionNav } from "@/components/discovery/detail-section-nav";
import type {
  BuildSkeletonRow,
  DetailCardLite,
  RoleStapleGroup,
} from "@/lib/discovery/detail-pack";
import type { CardRelative } from "@/lib/scryfall/card-relatives";
import type { CardDetailView, PrintingFinish } from "@/lib/scryfall/card-printing";
import {
  DETAIL_SECTION_IDS,
  type DetailSectionNavItem,
} from "@/lib/ui/detail-section-nav";
import {
  DETAIL_LISTS_GRID_CLASS,
  DETAIL_SECTION_NAV_STICKY_CLASS,
  DETAIL_SECTION_NAV_STICKY_SHEET_CLASS,
} from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type CardDetailListsProps = {
  slug: string;
  isCommander: boolean;
  activeView: CardDetailView;
  setCode: string | null;
  collectorNumber: string | null;
  finish: PrintingFinish | null;
  sectionNavItems: DetailSectionNavItem[];
  similar: DetailCardLite[];
  subtypes: string[];
  relatives: CardRelative[];
  roleStaples: RoleStapleGroup[];
  gameChangers: DetailCardLite[];
  buildSkeleton: BuildSkeletonRow[];
  /** Page PDP (default) or modal sheet — sticky chrome + denser grids. */
  variant?: "page" | "sheet";
  /** Modal: switch As card / As commander without navigating. */
  onViewChange?: (view: CardDetailView) => void;
  className?: string;
};

export function CardDetailLists({
  slug,
  isCommander,
  activeView,
  setCode,
  collectorNumber,
  finish,
  sectionNavItems,
  similar,
  subtypes,
  relatives,
  roleStaples,
  gameChangers,
  buildSkeleton,
  variant = "page",
  onViewChange,
  className,
}: CardDetailListsProps) {
  const showToc = sectionNavItems.length >= 2;
  /** No lateral TOC at `lg+` — use denser card columns so tiles don’t grow huge. */
  const wideGrid = !showToc;
  const gridDensity = variant === "sheet" ? "sheet" : "page";

  const sections =
    activeView === "commander" ? (
      <>
        <RoleStaplesSection
          groups={roleStaples}
          wideGrid={wideGrid}
          gridDensity={gridDensity}
        />
        {gameChangers.length > 0 ? (
          <DetailCardGridSection
            id={DETAIL_SECTION_IDS.gameChangers}
            title="Game Changers"
            cards={gameChangers}
            wideGrid={wideGrid}
            gridDensity={gridDensity}
          />
        ) : null}
        {buildSkeleton.length > 0 ? (
          <BuildSkeletonSection rows={buildSkeleton} />
        ) : null}
      </>
    ) : (
      <>
        {similar.length > 0 ? (
          <DetailCardGridSection
            id={DETAIL_SECTION_IDS.similarCards}
            title="Similar cards"
            cards={similar}
            wideGrid={wideGrid}
            gridDensity={gridDensity}
          />
        ) : null}
        <CardRelativesBySubtype
          subtypes={subtypes}
          relatives={relatives}
          wideGrid={wideGrid}
          gridDensity={gridDensity}
        />
      </>
    );

  const tocKey = sectionNavItems.map((item) => item.id).join("|");

  return (
    <section
      className={cn(
        variant === "page" ? "mt-10 space-y-4" : "space-y-4",
        className,
      )}
      aria-label="Related lists"
    >
      {isCommander ? (
        <CardDetailViewToggle
          slug={slug}
          activeView={activeView}
          setCode={setCode}
          collectorNumber={collectorNumber}
          finish={finish}
          onViewChange={onViewChange}
        />
      ) : null}

      {showToc ? (
        <DetailSectionJump
          key={`jump-${activeView}-${tocKey}`}
          items={sectionNavItems}
          variant={variant}
        />
      ) : null}

      {showToc ? (
        <div className={DETAIL_LISTS_GRID_CLASS}>
          <div
            className={
              variant === "sheet"
                ? DETAIL_SECTION_NAV_STICKY_SHEET_CLASS
                : DETAIL_SECTION_NAV_STICKY_CLASS
            }
          >
            <DetailSectionNav
              key={`nav-${activeView}-${tocKey}`}
              items={sectionNavItems}
            />
          </div>
          <div className="min-w-0 space-y-6">{sections}</div>
        </div>
      ) : (
        <div className="min-w-0 space-y-6">{sections}</div>
      )}
    </section>
  );
}
