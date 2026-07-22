/**
 * Parse CSV / paste lines into printing-resolve rows for collection import.
 *
 * Supported shapes (header optional):
 * - `qty,set,cn,finish`  e.g. `1,MH2,240,foil`
 * - `qty set cn finish`  e.g. `1 MH2 240 foil`
 * - `set|cn|finish|qty`  e.g. `mh2|240|foil|1`
 *
 * Finish defaults to nonfoil; qty defaults to 1.
 */

import {
  parsePrintingFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

export type CollectionImportRow = {
  lineNumber: number;
  raw: string;
  setCode: string;
  collectorNumber: string;
  finish: PrintingFinish;
  quantity: number;
};

export type CollectionImportParseResult = {
  rows: CollectionImportRow[];
  errors: { lineNumber: number; raw: string; message: string }[];
};

const HEADER_HINT =
  /^(qty|quantity|count|set|setcode|cn|collector|finish|foil)/i;

function splitFields(line: string): string[] {
  if (line.includes("|")) {
    return line.split("|").map((part) => part.trim()).filter(Boolean);
  }
  if (line.includes(",")) {
    return line.split(",").map((part) => part.trim()).filter(Boolean);
  }
  return line.split(/\s+/).filter(Boolean);
}

function parseQuantity(value: string | undefined, fallback: number): number | null {
  if (value == null || value === "") return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function looksLikeSetCode(value: string): boolean {
  return /^[a-z0-9]{2,5}$/i.test(value);
}

function looksLikeCollectorNumber(value: string): boolean {
  return /^[0-9a-z]+$/i.test(value) && value.length <= 12;
}

function parseLine(
  lineNumber: number,
  raw: string,
): CollectionImportRow | { error: string } {
  const fields = splitFields(raw);
  if (fields.length < 2) {
    return { error: "Need at least set code and collector number." };
  }

  // set|cn|finish|qty
  if (raw.includes("|") && looksLikeSetCode(fields[0]!)) {
    const setCode = fields[0]!.toLowerCase();
    const collectorNumber = fields[1]!;
    const finish = parsePrintingFinish(fields[2]) ?? "nonfoil";
    const quantity = parseQuantity(fields[3], 1);
    if (quantity == null) return { error: "Invalid quantity." };
    return { lineNumber, raw, setCode, collectorNumber, finish, quantity };
  }

  // qty,set,cn,finish  or  qty set cn finish
  const qtyFirst = parseQuantity(fields[0], NaN);
  if (qtyFirst != null && Number.isFinite(qtyFirst) && fields.length >= 3) {
    const setCode = fields[1]!.toLowerCase();
    const collectorNumber = fields[2]!;
    if (!looksLikeSetCode(setCode) || !looksLikeCollectorNumber(collectorNumber)) {
      return { error: "Could not parse set code / collector number." };
    }
    const finish = parsePrintingFinish(fields[3]) ?? "nonfoil";
    return {
      lineNumber,
      raw,
      setCode,
      collectorNumber,
      finish,
      quantity: qtyFirst,
    };
  }

  // set,cn,finish[,qty]
  if (looksLikeSetCode(fields[0]!) && looksLikeCollectorNumber(fields[1]!)) {
    const setCode = fields[0]!.toLowerCase();
    const collectorNumber = fields[1]!;
    const finish = parsePrintingFinish(fields[2]) ?? "nonfoil";
    const quantity = parseQuantity(fields[3], 1);
    if (quantity == null) return { error: "Invalid quantity." };
    return { lineNumber, raw, setCode, collectorNumber, finish, quantity };
  }

  return {
    error: "Unrecognized format. Use: qty,set,cn,finish (e.g. 1,MH2,240,foil).",
  };
}

export function parseCollectionImportText(text: string): CollectionImportParseResult {
  const rows: CollectionImportRow[] = [];
  const errors: CollectionImportParseResult["errors"] = [];

  const lines = text.split(/\r?\n/);
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = lines[i]!.trim();
    if (!raw || raw.startsWith("#")) continue;

    if (!started && HEADER_HINT.test(raw) && !/^\d/.test(raw)) {
      started = true;
      continue;
    }
    started = true;

    const parsed = parseLine(lineNumber, raw);
    if ("error" in parsed) {
      errors.push({ lineNumber, raw, message: parsed.error });
      continue;
    }
    rows.push(parsed);
  }

  return { rows, errors };
}
