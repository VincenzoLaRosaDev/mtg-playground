import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";

type MetaUnavailableNoticeProps = {
  context: "commander-page" | "card-section";
};

export function MetaUnavailableNotice({ context }: MetaUnavailableNoticeProps) {
  return (
    <DetailSectionPanel title="Popularity data not available" className="bg-muted/50">
      <p className="mt-2 text-sm text-muted-foreground">
        {context === "commander-page"
          ? "This commander is in the catalog. Rank, salt, and deck stats will appear here once popularity data is synced."
          : "Deck stats and commander popularity for this card are not in the catalog yet."}
      </p>
    </DetailSectionPanel>
  );
}
