"use client";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import type { CardFaceImage } from "@/lib/scryfall/faces";

type SetPrintingTileProps = {
  printingId: string;
  name: string;
  collectorNumber: string;
  imageUri: string | null;
  faces: CardFaceImage[];
  slug: string | null;
  setCode: string;
};

/** Set detail printing tile — primary click opens the unified card modal. */
export function SetPrintingTile({
  printingId,
  name,
  collectorNumber,
  imageUri,
  faces,
  slug,
  setCode,
}: SetPrintingTileProps) {
  const { openCardDetail } = useCardDetailModal();
  const detailHref = slug
    ? `/cards/${slug}?set=${setCode}&cn=${encodeURIComponent(collectorNumber)}`
    : null;

  return (
    <CardFaceTile
      href={detailHref}
      onOpen={
        slug
          ? () =>
              openCardDetail({
                mode: "collection",
                slug,
                preferredPrintingId: printingId,
                initialSet: setCode,
                initialCn: collectorNumber,
                imageUri,
                faces,
              })
          : undefined
      }
      imageUri={imageUri}
      faces={faces}
      name={name}
      footer={
        <p className="w-full text-center text-xs tabular-nums text-muted-foreground">
          #{collectorNumber}
        </p>
      }
    />
  );
}
