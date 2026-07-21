import type { CardFaceImage } from "@/lib/scryfall/faces";

/** Card hit — browse-tile compatible fields for `/search` grids. */
export type GlobalSearchCardResult = {
  id: string;
  slug: string | null;
  name: string;
  typeLine: string;
  cmc: number;
  colorIdentity: string[];
  imageUri: string | null;
  faces: CardFaceImage[];
  isCommander: boolean;
  prices: unknown;
  popularityRank: number | null;
  frictionScore: number;
  isGameChanger: boolean;
  isReserved: boolean;
};

/** Set hit — set-browse-row compatible fields for `/search` grids. */
export type GlobalSearchSetResult = {
  code: string;
  name: string;
  setType: string;
  iconUri: string | null;
  releasedAt: string | null;
  digital: boolean;
  cardCount: number;
  indexedCardCount: number;
};

export type GlobalSearchResponse = {
  query: string;
  cards: GlobalSearchCardResult[];
  sets: GlobalSearchSetResult[];
};

export const GLOBAL_SEARCH_MIN_QUERY_LENGTH = 2;
export const GLOBAL_SEARCH_DEFAULT_LIMIT = 8;
export const GLOBAL_SEARCH_MAX_LIMIT = 20;
