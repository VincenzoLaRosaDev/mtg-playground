import {
  CARD_FACE_ASPECT_CLASS,
  CARD_FACE_DETAIL_GRID_CLASS,
  CARD_FACE_GRID_CLASS,
  CARD_FACE_RADIUS_CLASS,
  cardFacePlaceholderClassName,
} from "@/lib/ui/card-face";
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

  const faceClass = cn(
    CARD_FACE_ASPECT_CLASS,
    CARD_FACE_RADIUS_CLASS,
    "w-full bg-muted",
  );

  return (
    <div className={cn("animate-pulse", className)} aria-hidden>
      <div className={faceClass} />
      {showFooter ? (
        <div className="mt-2 w-full min-w-0 space-y-2">
          <div className="h-3 w-[70%] rounded bg-muted" />
          {footerLines > 1 ? <div className="h-3 w-[40%] rounded bg-muted" /> : null}
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
 * Pulse placeholders for overlay card grids (workspace search).
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
