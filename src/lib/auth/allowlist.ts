/**
 * Email allowlist for closed-beta sign-in.
 *
 * Google's "Testing" publishing status does NOT gate apps that request only the
 * basic `openid` / `email` / `profile` scopes — any Google account can complete
 * the flow, test user list or not. See "Manage App Audience" in Google Cloud
 * docs. This allowlist is therefore the only real access gate for the beta.
 *
 * `AUTH_ALLOWED_EMAILS` is a comma-separated list. Entries can be:
 *   - a full address        `someone@example.com`
 *   - a whole domain        `@example.com`
 *
 * When the variable is unset or empty, sign-in is OPEN to anyone (public launch).
 */

export function parseAllowlist(raw: string | undefined | null): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isEmailAllowed(
  email: string | undefined | null,
  raw: string | undefined | null = process.env.AUTH_ALLOWED_EMAILS,
): boolean {
  const allowlist = parseAllowlist(raw);

  // Empty allowlist = open sign-up.
  if (allowlist.length === 0) {
    return true;
  }

  const normalized = email?.trim().toLowerCase();

  if (!normalized || !normalized.includes("@")) {
    return false;
  }

  const domain = normalized.slice(normalized.lastIndexOf("@"));

  return allowlist.some((entry) => (entry.startsWith("@") ? entry === domain : entry === normalized));
}
