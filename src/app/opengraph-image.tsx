import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { MANA_SYMBOL_INNER_SVG } from "@/lib/mtg/mana-symbol-data";

export const runtime = "nodejs";
export const alt = "MTGPlayground — MTG catalog, collection & multi-format decks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0f18";
const CARD_BG = "#121a27";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const TEXT_MUTED = "#8b93a3";
const TEXT_FAINT = "#5b6373";
const AMBER = "#efa831";
const PRICE_BG = "rgba(255,255,255,0.05)";
const PRICE_BORDER = "rgba(255,255,255,0.14)";
const FOIL_BORDER = "#efa831";
const FOIL_BG = "rgba(239,168,49,0.12)";

type ManaSymbol = keyof typeof MANA_SYMBOL_INNER_SVG;

/** Matches src/lib/mtg/mana-palette.ts MANA_BAR_FILL — kept local to avoid pulling client-only types into the OG route. */
const MANA_COLORS: Record<ManaSymbol, string> = {
  W: "#F8F6D8",
  U: "#C1D7E9",
  B: "#CAC5C0",
  R: "#E49977",
  G: "#A3C095",
  C: "#B0ABA6",
};

function manaSymbolDataUri(symbol: ManaSymbol): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${MANA_SYMBOL_INNER_SVG[symbol]}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const MANA_SYMBOLS: ManaSymbol[] = ["W", "U", "B", "R", "G", "C"];
const MANA_SYMBOL_URIS = Object.fromEntries(
  MANA_SYMBOLS.map((s) => [s, manaSymbolDataUri(s)]),
) as Record<ManaSymbol, string>;

type Row = { name: string; pips: ManaSymbol[]; price: string; foil?: boolean };

const COMMANDER: Row = {
  name: "The Ur-Dragon",
  pips: ["W", "U", "B", "R", "G"],
  price: "€6.40",
  foil: true,
};

const MAIN_ROWS: Row[] = [
  { name: "Sol Ring", pips: ["C"], price: "€1.20" },
  { name: "Dragonlord Atarka", pips: ["R", "G"], price: "€8.90" },
  { name: "Bladewing the Risen", pips: ["B", "R"], price: "€0.90", foil: true },
  { name: "Scion of the Ur-Dragon", pips: ["W", "U", "B", "R", "G"], price: "€0.40" },
];

const CURVE = [
  { label: "0", value: 1 },
  { label: "1", value: 4 },
  { label: "2", value: 9 },
  { label: "3", value: 22 },
  { label: "4", value: 15 },
  { label: "5", value: 4 },
  { label: "6", value: 4 },
  { label: "7+", value: 5 },
];
const CURVE_MAX = Math.max(...CURVE.map((c) => c.value));
const CURVE_BAR_MAX_H = 62;

/** Illustrative color share of the deck — pill width scales with percentage. */
const COLOR_PILLS: { symbol: ManaSymbol; percent: number }[] = [
  { symbol: "W", percent: 15 },
  { symbol: "U", percent: 19 },
  { symbol: "B", percent: 15 },
  { symbol: "R", percent: 26 },
  { symbol: "G", percent: 25 },
];
const COLOR_PILLS_TOTAL_PERCENT = COLOR_PILLS.reduce((sum, p) => sum + p.percent, 0);
const COLOR_PILLS_ROW_WIDTH = 508;
const COLOR_PILLS_GAP = 8;

function Pip({ symbol }: { symbol: ManaSymbol }) {
  return (
    <img
      src={MANA_SYMBOL_URIS[symbol]}
      alt=""
      width={26}
      height={26}
      style={{ display: "flex", borderRadius: 999 }}
    />
  );
}

function PriceChip({ price, foil }: { price: string; foil?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        color: foil ? AMBER : "#c4cad4",
        background: foil ? FOIL_BG : PRICE_BG,
        border: `1px solid ${foil ? FOIL_BORDER : PRICE_BORDER}`,
      }}
    >
      {price}
      {foil ? " F" : ""}
    </div>
  );
}

function CardRow({ row }: { row: Row }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: 32,
        gap: 12,
      }}
    >
      <div style={{ display: "flex", fontSize: 15, color: TEXT_FAINT, width: 22 }}>1×</div>
      <div style={{ display: "flex", fontSize: 17, color: "#d8dce3", flexGrow: 1 }}>
        {row.name}
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
        {row.pips.map((p, i) => (
          <Pip key={i} symbol={p} />
        ))}
      </div>
      <PriceChip price={row.price} foil={row.foil} />
    </div>
  );
}

/**
 * Card art fan — rendered back-to-front (background cards first, commander last)
 * so the commander stays on top. Staggered rightward and at uneven heights.
 */
const CARD_FAN = [
  { file: "sol-ring.jpg", left: 325, top: 405, width: 170, opacity: 0.85 },
  { file: "dragonlord-atarka.jpg", left: 270, top: 290, width: 190, opacity: 0.88 },
  { file: "bladewing-the-risen.jpg", left: 220, top: 365, width: 205, opacity: 0.9 },
  { file: "scion-of-the-ur-dragon.jpg", left: 165, top: 270, width: 220, opacity: 0.93 },
  { file: "the-ur-dragon.jpg", left: 75, top: 331, width: 300, opacity: 1 },
] as const;
/** Real card aspect ratio (Scryfall "normal" size, 488×680). */
const CARD_ASPECT = 680 / 488;

export default async function OpengraphImage() {
  const logoSvg = await readFile(
    join(process.cwd(), "public/mtgplayground-lockup-horizontal.svg"),
  );
  const logoDataUri = `data:image/svg+xml;base64,${logoSvg.toString("base64")}`;

  const cardFanUris = await Promise.all(
    CARD_FAN.map(async (card) => {
      const buffer = await readFile(join(process.cwd(), "public/og", card.file));
      return `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BG,
        }}
      >
        {/* Diagonal brand wedge — mirrored to the left */}
        <svg
          width={1200}
          height={630}
          viewBox="0 0 1200 630"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="wedge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#241a0d" />
              <stop offset="100%" stopColor="#0c0805" />
            </linearGradient>
          </defs>
          <polygon points="0,0 400,0 220,630 0,630" fill="url(#wedge)" />
          <line x1="400" y1="0" x2="220" y2="630" stroke={AMBER} strokeWidth="3" strokeOpacity="0.55" />
        </svg>

        {/* Card fan — commander art rises from the bottom of the logo column, others staggered behind it */}
        {CARD_FAN.map((card, i) => (
          <img
            key={card.file}
            src={cardFanUris[i]}
            alt=""
            width={card.width}
            height={Math.round(card.width * CARD_ASPECT)}
            style={{
              position: "absolute",
              left: card.left,
              top: card.top,
              opacity: card.opacity,
              borderRadius: 14,
              border: "2px solid rgba(255,255,255,0.14)",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.45)",
            }}
          />
        ))}

        {/* Deck + stats mockup panel — right side */}
        <div
          style={{
            position: "absolute",
            left: 580,
            top: 65,
            width: 560,
            height: 500,
            display: "flex",
            flexDirection: "column",
            padding: 26,
            borderRadius: 24,
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
          }}
        >
          {/* Commander */}
          <div style={{ display: "flex", fontSize: 12, letterSpacing: 1, color: TEXT_FAINT }}>
            COMMANDER (1)
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
            <CardRow row={COMMANDER} />
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 8,
              marginBottom: 8,
              height: 1,
              width: "100%",
              background: CARD_BORDER,
            }}
          />

          {/* Main */}
          <div style={{ display: "flex", fontSize: 12, letterSpacing: 1, color: TEXT_FAINT }}>
            MAIN (99) · CREATURE (31)
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 6, gap: 2 }}>
            {MAIN_ROWS.map((row) => (
              <CardRow key={row.name} row={row} />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 10,
              marginBottom: 10,
              height: 1,
              width: "100%",
              background: CARD_BORDER,
            }}
          />

          {/* Mana curve */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", fontSize: 12, letterSpacing: 1, color: TEXT_FAINT }}>
              MANA CURVE
            </div>
            <div style={{ display: "flex", fontSize: 13, color: TEXT_MUTED }}>Avg MV 3.91</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              marginTop: 14,
            }}
          >
            {CURVE.map((bar) => (
              <div
                key={bar.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 34,
                }}
              >
                <div style={{ display: "flex", fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>
                  {bar.value}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: Math.max(6, (bar.value / CURVE_MAX) * CURVE_BAR_MAX_H),
                    borderRadius: 4,
                    background: AMBER,
                  }}
                />
                <div style={{ display: "flex", fontSize: 11, color: TEXT_FAINT, marginTop: 6 }}>
                  {bar.label}
                </div>
              </div>
            ))}
          </div>

          {/* Colors */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
            <div style={{ display: "flex", fontSize: 12, letterSpacing: 1, color: TEXT_FAINT }}>
              COLORS
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: COLOR_PILLS_GAP,
                marginTop: 10,
              }}
            >
              {COLOR_PILLS.map(({ symbol, percent }) => {
                const usableWidth =
                  COLOR_PILLS_ROW_WIDTH - COLOR_PILLS_GAP * (COLOR_PILLS.length - 1);
                const width = (percent / COLOR_PILLS_TOTAL_PERCENT) * usableWidth;

                return (
                  <div
                    key={symbol}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width,
                      height: 46,
                      borderRadius: 10,
                      background: MANA_COLORS[symbol],
                    }}
                  >
                    <img src={MANA_SYMBOL_URIS[symbol]} alt="" width={28} height={28} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logo lockup — mirrored to the left, sitting lower, clear of the content panel */}
        <img
          src={logoDataUri}
          alt=""
          width={480}
          height={96}
          style={{ position: "absolute", left: 36, top: 140 }}
        />
      </div>
    ),
    { ...size },
  );
}
