export type CursorPayload = Record<string, string | number | boolean | null>;

export function encodeBrowseCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeBrowseCursor<T extends CursorPayload>(
  cursor: string | null | undefined,
): T | null {
  if (!cursor?.trim()) {
    return null;
  }

  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as T;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
