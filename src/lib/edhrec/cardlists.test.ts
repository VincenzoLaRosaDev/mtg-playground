import { describe, expect, it } from "vitest";

import {
  parseCardDetailCardlists,
  parseCommanderCardlists,
  partitionDetailCardlistSections,
} from "@/lib/edhrec/cardlists";
import type { EdhrecCardView } from "@/lib/edhrec/types";

function card(name: string): EdhrecCardView {
  return {
    name,
    sanitized: name.toLowerCase().replace(/\s+/g, "-"),
  };
}

describe("parseCommanderCardlists", () => {
  it("orders known sections by priority and skips empty lists", () => {
    const sections = parseCommanderCardlists({
      lands: { tag: "lands", header: "Lands", cardviews: [card("Command Tower")] },
      highsynergycards: {
        tag: "highsynergycards",
        header: "High Synergy Cards",
        cardviews: [card("Rhystic Study")],
      },
      empty: { tag: "topcards", header: "Top Cards", cardviews: [] },
      topcommanders: {
        tag: "topcommanders",
        header: "Top Commanders",
        cardviews: [card("Atraxa")],
      },
    });

    expect(sections.map((section) => section.tag)).toEqual(["highsynergycards", "lands"]);
    expect(sections[0]?.showSynergy).toBe(true);
    expect(sections[0]?.linkTo).toBe("card");
  });

  it("accepts array-shaped cardlists input", () => {
    const sections = parseCommanderCardlists([
      {
        tag: "newcards",
        header: "New Cards",
        cardviews: [card("Recent Staple")],
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe("newcards");
  });
});

describe("parseCardDetailCardlists", () => {
  it("excludes topcommanders / high synergy / average deck and links new commanders", () => {
    const sections = parseCardDetailCardlists({
      topcommanders: {
        tag: "topcommanders",
        header: "Top Commanders",
        cardviews: [card("Atraxa")],
      },
      highsynergycards: {
        tag: "highsynergycards",
        header: "High Synergy",
        cardviews: [card("Sol Ring")],
      },
      averagedeck: {
        tag: "averagedeck",
        header: "Average Deck",
        cardviews: [card("Island")],
      },
      newcommanders: {
        tag: "newcommanders",
        header: "New Commanders",
        cardviews: [card("New Legend")],
      },
      topcards: {
        tag: "topcards",
        header: "Top Cards",
        cardviews: [card("Lightning Greaves")],
      },
    });

    expect(sections.map((section) => section.tag)).toEqual(["newcommanders", "topcards"]);
    expect(sections[0]?.linkTo).toBe("commander");
    expect(sections[1]?.linkTo).toBe("card");
  });
});

describe("partitionDetailCardlistSections", () => {
  it("splits unique vs shared tags for card view", () => {
    const sections = parseCardDetailCardlists({
      newcommanders: {
        tag: "newcommanders",
        header: "New Commanders",
        cardviews: [card("Legend")],
      },
      topcards: {
        tag: "topcards",
        header: "Top Cards",
        cardviews: [card("Staple")],
      },
    });

    const { unique, shared } = partitionDetailCardlistSections(sections, "card");
    expect(unique.map((section) => section.tag)).toEqual(["newcommanders"]);
    expect(shared.map((section) => section.tag)).toEqual(["topcards"]);
  });
});
