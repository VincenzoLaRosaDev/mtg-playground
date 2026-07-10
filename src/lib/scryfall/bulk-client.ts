import type { ScryfallBulkData } from "@/lib/scryfall/types";

export const SCRYFALL_USER_AGENT = "EDHForge/1.0 (+https://github.com/VincenzoLaRosaDev/edhforge)";

export const ORACLE_CARDS_BULK_TYPE = "oracle_cards";
export const ORACLE_TAGS_BULK_TYPE = "oracle_tags";

export async function fetchBulkMetadata(
  bulkType = ORACLE_CARDS_BULK_TYPE,
): Promise<ScryfallBulkData> {
  const response = await fetch(`https://api.scryfall.com/bulk-data/${bulkType}`, {
    headers: { Accept: "application/json", "User-Agent": SCRYFALL_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Scryfall bulk metadata failed: ${response.status}`);
  }

  return response.json() as Promise<ScryfallBulkData>;
}

export function getBulkDownloadUrl(bulk: ScryfallBulkData): string {
  const url = bulk.jsonl_download_uri ?? bulk.download_uri;
  if (!url) {
    throw new Error(`Scryfall bulk ${bulk.type} has no download URI`);
  }
  return url;
}
