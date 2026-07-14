export type EdhrecCardView = {
  id?: string;
  name: string;
  sanitized?: string;
  url?: string;
  synergy?: number;
  inclusion?: number;
  num_decks?: number;
  potential_decks?: number;
  rank?: number;
  salt?: number;
};

export type EdhrecCardList = {
  header: string;
  tag?: string;
  cardviews?: EdhrecCardView[];
};

export type EdhrecCommanderCard = {
  name: string;
  sanitized: string;
  rank?: number;
  salt?: number;
  num_decks?: number;
  color_identity?: string[];
};

export type EdhrecCommanderPage = {
  tag_counts?: Record<string, number>;
  similar?: string[];
  bracket_counts?: unknown;
  budget_counts?: unknown;
  container: {
    json_dict: {
      card: EdhrecCommanderCard;
      cardlists: Record<string, EdhrecCardList>;
    };
  };
};

export type EdhrecListEntry = {
  slug: string;
  name: string;
  rank: number | null;
};

/** @deprecated Use EdhrecListEntry */
export type CommanderListEntry = EdhrecListEntry;

export type EdhrecCardPageCard = {
  name: string;
  sanitized: string;
  salt?: number;
  num_decks?: number;
  inclusion?: number;
  potential_decks?: number;
};

export type EdhrecCardPage = {
  similar?: string[];
  container: {
    json_dict: {
      card: EdhrecCardPageCard;
      cardlists: Record<string, EdhrecCardList>;
    };
  };
};
