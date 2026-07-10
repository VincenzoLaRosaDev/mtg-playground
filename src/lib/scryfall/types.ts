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
  content_encoding?: string;
};

export type ScryfallOracleTagWeight =
  | "very_strong"
  | "strong"
  | "median"
  | "weak";

export type ScryfallOracleTag = {
  object: "tag";
  id: string;
  slug: string;
  label: string;
  uri: string;
  type: "oracle" | "illustration";
  description?: string | null;
  parent_ids?: string[] | null;
  child_ids?: string[] | null;
  aliases?: string[] | null;
  taggings: ScryfallOracleTagging[];
};

export type ScryfallOracleTagging = {
  illustration_id?: string | null;
  oracle_id?: string | null;
  weight: ScryfallOracleTagWeight;
  annotation?: string | null;
};

export type ScryfallSet = {
  id: string;
  code: string;
  name: string;
  released_at: string | null;
  set_type: string;
  card_count: number;
  icon_svg_uri: string | null;
  digital: boolean;
};

export type ScryfallSetList = {
  data: ScryfallSet[];
  has_more: boolean;
  next_page?: string | null;
};

export type ScryfallSearchCard = ScryfallCard & {
  set: string;
  collector_number: string;
  rarity: string;
};

export type ScryfallSearchResult = {
  data: ScryfallSearchCard[];
  has_more: boolean;
  next_page?: string | null;
};
