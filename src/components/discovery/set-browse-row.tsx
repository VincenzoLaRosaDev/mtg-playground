import { CatalogPreviewCard } from "@/components/discovery/catalog-preview-card";
import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { formatReleaseDate, formatSetType } from "@/lib/scryfall/sets";

type SetBrowseRowProps = {
  set: SetBrowseItem;
};

function formatOverlay(set: SetBrowseItem): string {
  const type = formatSetType(set.setType);
  const cards =
    set.indexedCardCount > 0
      ? `${set.indexedCardCount.toLocaleString()} indexed`
      : `${set.cardCount.toLocaleString()} cards`;
  const released = formatReleaseDate(
    set.releasedAt ? new Date(set.releasedAt) : null,
  );
  return [type, cards, released].filter(Boolean).join(" · ");
}

/** Set browse / search preview card — art_crop of first indexed printing + set icon. */
export function SetBrowseRow({ set }: SetBrowseRowProps) {
  return (
    <CatalogPreviewCard
      href={`/sets/${set.code}`}
      name={set.name}
      coverImageUri={set.coverImageUri}
      overlay={formatOverlay(set)}
      setIconUri={set.iconUri}
      meta={`${set.code.toUpperCase()}${set.digital ? " · Digital" : ""}`}
      ariaLabel={`Open set ${set.name}`}
    />
  );
}
