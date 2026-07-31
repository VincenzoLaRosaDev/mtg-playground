import { CatalogPreviewCard } from "@/components/discovery/catalog-preview-card";
import type { PreconListItem } from "@/lib/precons/precons";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type PreconBrowseRowProps = {
  item: PreconListItem;
};

/** Precon browse preview card — commander/cover art_crop + Cost bar + set icon. */
export function PreconBrowseRow({ item }: PreconBrowseRowProps) {
  const overlay = [
    item.formatLabel,
    `${item.cardCount.toLocaleString()} cards`,
    formatDate(item.releaseDate),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CatalogPreviewCard
      href={`/precons/${item.slug}`}
      name={item.name}
      coverImageUri={item.previewImageUri}
      coverAlt={item.previewName ?? ""}
      overlay={overlay}
      setIconUri={item.setIconUri}
      meta={`${item.code.toUpperCase()} · ${item.type}`}
      costSegments={item.costSegments}
      ariaLabel={`Open precon ${item.name}`}
    />
  );
}
