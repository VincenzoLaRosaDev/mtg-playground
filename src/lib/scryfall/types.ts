export type ScryfallCard = {
  id: string;
  oracle_id: string;
  name: string;
  type_line: string;
  cmc: number;
  mana_value?: number;
  colors: string[];
  color_identity: string[];
  oracle_text?: string | null;
  keywords: string[];
  produced_mana?: string[];
  layout: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{
    name: string;
    image_uris?: { normal?: string; small?: string };
  }>;
  legalities: Record<string, string>;
  prices?: Record<string, string | null>;
};

export type ScryfallBulkData = {
  type: string;
  updated_at: string;
  download_uri: string;
  jsonl_download_uri?: string;
};
