import {
  CARD_FACE_ASPECT_CLASS,
  CARD_FACE_DETAIL_GRID_CLASS,
  CARD_FACE_GRID_CLASS,
  CARD_FACE_RADIUS_CLASS,
  SET_BROWSE_GRID_CLASS,
  cardFacePlaceholderClassName,
} from "@/lib/ui/card-face";
import {
  CARD_DETAIL_IMAGE_MAX_CLASS,
  DETAIL_LISTS_GRID_CLASS,
} from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type CardFaceSkeletonVariant = "thumbnail" | "grid" | "detail";

type CardFaceSkeletonProps = {
  variant?: CardFaceSkeletonVariant;
  /** Footer line placeholders under grid/detail faces. */
  showFooter?: boolean;
  /** Match real tile footers (set #cn = 1; browse metrics = 2). */
  footerLines?: 1 | 2;
  className?: string;
};

/**
 * Single card-face pulse block — reuse anywhere a printing preview is pending.
 */
export function CardFaceSkeleton({
  variant = "grid",
  showFooter = variant !== "thumbnail",
  footerLines = 2,
  className,
}: CardFaceSkeletonProps) {
  if (variant === "thumbnail") {
    return (
      <div
        className={cn(
          cardFacePlaceholderClassName("thumbnail"),
          "animate-pulse bg-muted",
          className,
        )}
        aria-hidden
      />
    );
  }

  const faceClass =
    variant === "detail"
      ? cn(
          CARD_FACE_ASPECT_CLASS,
          CARD_FACE_RADIUS_CLASS,
          "w-full bg-muted",
          CARD_DETAIL_IMAGE_MAX_CLASS,
        )
      : cn(CARD_FACE_ASPECT_CLASS, CARD_FACE_RADIUS_CLASS, "w-full bg-muted");

  return (
    <div className={cn("animate-pulse", className)} aria-hidden>
      <div className={faceClass} />
      {showFooter ? (
        <div className="mt-2 space-y-2">
          <div className="mx-auto h-3 w-[70%] rounded bg-muted" />
          {footerLines > 1 ? <div className="mx-auto h-3 w-[40%] rounded bg-muted" /> : null}
        </div>
      ) : null}
    </div>
  );
}

type CardGridSkeletonProps = {
  count?: number;
  /** Browse grid (default) or detail-section denser grid. */
  layout?: "browse" | "detail";
  footerLines?: 1 | 2;
  className?: string;
};

/**
 * Pulse placeholders for catalog / detail card grids.
 */
export function CardGridSkeleton({
  count = 10,
  layout = "browse",
  footerLines = 2,
  className,
}: CardGridSkeletonProps) {
  const gridClass =
    layout === "detail" ? CARD_FACE_DETAIL_GRID_CLASS : CARD_FACE_GRID_CLASS;

  return (
    <div className={cn(gridClass, className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <CardFaceSkeleton key={index} variant="grid" footerLines={footerLines} />
      ))}
    </div>
  );
}

type SetBrowseGridSkeletonProps = {
  count?: number;
  className?: string;
};

/** Horizontal set-row placeholders for `/sets` and search set hits. */
export function SetBrowseGridSkeleton({
  count = 6,
  className,
}: SetBrowseGridSkeletonProps) {
  return (
    <ul className={cn(SET_BROWSE_GRID_CLASS, className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="min-w-0 animate-pulse">
          <div className="flex h-full items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="size-10 shrink-0 rounded bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-[55%] rounded bg-muted" />
              <div className="h-3 w-[35%] rounded bg-muted" />
              <div className="h-3 w-[25%] rounded bg-muted" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

type SearchHitListSkeletonProps = {
  count?: number;
  className?: string;
};

/** Compact thumbnail + text rows for header search / workspace overlay. */
export function SearchHitListSkeleton({
  count = 6,
  className,
}: SearchHitListSkeletonProps) {
  return (
    <ul className={cn("space-y-1", className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-lg px-2 py-2"
        >
          <CardFaceSkeleton variant="thumbnail" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-[55%] rounded bg-muted" />
            <div className="h-3 w-[40%] rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Match [`PageListMeta`] — one text-sm line, no extra margin. */
export function PageListMetaSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-5 w-56 max-w-full animate-pulse rounded bg-muted", className)} aria-hidden />
  );
}

/** Match PageShell breadcrumb row height (when not using real breadcrumb slots). */
export function BreadcrumbSkeleton({ segments = 2 }: { segments?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-hidden>
      {Array.from({ length: segments }, (_, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 ? <span className="text-sm text-muted-foreground">/</span> : null}
          <span className="h-4 w-16 animate-pulse rounded bg-muted" />
        </span>
      ))}
    </div>
  );
}

function ToolbarFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-3 w-12 rounded bg-muted" />
      <div className="h-8 w-full rounded-lg bg-muted" />
    </div>
  );
}

/** One facet group: label + pill row (matches BrowseFilterSection). */
function ToolbarFacetGroupSkeleton({
  labelClassName,
  pills,
  pillClassName = "h-7 w-8",
}: {
  labelClassName: string;
  pills: number;
  pillClassName?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className={cn("h-3 rounded bg-muted", labelClassName)} />
      <div className="flex flex-nowrap gap-1.5 overflow-hidden">
        {Array.from({ length: pills }, (_, index) => (
          <div key={index} className={cn("shrink-0 rounded-lg bg-muted", pillClassName)} />
        ))}
      </div>
    </div>
  );
}

/**
 * Color / Rarity / Options — hug content with shared pill-group gap.
 */
function ToolbarFacetRowSkeleton({
  variant = "hub",
}: {
  variant?: "hub" | "setDetail";
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
      <ToolbarFacetGroupSkeleton labelClassName="w-24" pills={5} pillClassName="h-7 w-7" />
      <ToolbarFacetGroupSkeleton labelClassName="w-12" pills={4} pillClassName="h-7 w-14" />
      {variant === "hub" ? (
        <ToolbarFacetGroupSkeleton labelClassName="w-14" pills={3} pillClassName="h-7 w-[4.5rem]" />
      ) : (
        <ToolbarFacetGroupSkeleton labelClassName="w-14" pills={1} pillClassName="h-7 w-24" />
      )}
    </div>
  );
}

type BrowseToolbarSkeletonProps = {
  /** Hub = multi-row browse filters; setDetail = set card filters footprint. */
  variant?: "hub" | "setDetail";
  className?: string;
};

/**
 * Reserves filter-panel height so PageShell toolbar slot matches the loaded page.
 */
export function BrowseToolbarSkeleton({
  variant = "hub",
  className,
}: BrowseToolbarSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border/60 bg-card/40 px-3 py-3 shadow-sm",
        className,
      )}
      aria-hidden
    >
      <div className="space-y-3">
        <div
          className={cn(
            "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2",
            variant === "hub"
              ? "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1.25fr)_auto]"
              : "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto_minmax(0,1.1fr)]",
          )}
        >
          <ToolbarFieldSkeleton className="sm:col-span-2 lg:col-span-1" />
          <ToolbarFieldSkeleton />
          <ToolbarFieldSkeleton />
          {variant === "setDetail" ? <ToolbarFieldSkeleton /> : null}
          <div className="space-y-1">
            <div className="h-3 w-10 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-[4.5rem] rounded-lg bg-muted" />
              <div className="h-8 w-[4.5rem] rounded-lg bg-muted" />
            </div>
          </div>
        </div>

        {variant === "hub" ? (
          <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-3">
            <ToolbarFieldSkeleton />
            <ToolbarFieldSkeleton />
            <ToolbarFieldSkeleton />
          </div>
        ) : null}

        <ToolbarFacetRowSkeleton variant={variant} />
      </div>
    </div>
  );
}

/** Compact printing rows for collection add sheet (not card faces). */
export function PrintingListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="max-h-48 space-y-1 overflow-hidden rounded-lg border border-border p-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-2 rounded-md px-2 py-1.5">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-3.5 w-32 max-w-[50%] rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/** Detail PDP hero: image column + overview panel blocks. */
export function CardDetailHeroSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-10"
      aria-hidden
    >
      <div className="mx-auto w-full animate-pulse space-y-3 lg:mx-0">
        <CardFaceSkeleton variant="detail" showFooter={false} />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
      <div className="animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-8 w-full rounded-lg bg-muted" />
          <div className="h-8 w-1/2 rounded-lg bg-muted" />
          <div className="h-7 w-36 rounded-lg bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Lists band: TOC column + section grid (matches DETAIL_LISTS_GRID_CLASS). */
export function DetailListsBandSkeleton() {
  return (
    <div className={cn("mt-10", DETAIL_LISTS_GRID_CLASS)} aria-hidden>
      <div className="hidden animate-pulse space-y-3 lg:block">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-8 w-full rounded-lg bg-muted" />
        <div className="h-8 w-full rounded-lg bg-muted" />
        <div className="h-8 w-[80%] rounded-lg bg-muted" />
      </div>
      <div className="space-y-6">
        <div className="h-9 w-full animate-pulse rounded-lg bg-muted lg:hidden" />
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <CardGridSkeleton count={8} layout="detail" />
        </div>
      </div>
    </div>
  );
}
