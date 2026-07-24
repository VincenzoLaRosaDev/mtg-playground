import { describe, expect, it } from "vitest";

import { isEmailAllowed, parseAllowlist } from "@/lib/auth/allowlist";

describe("parseAllowlist", () => {
  it("returns an empty list when unset or blank", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("")).toEqual([]);
    expect(parseAllowlist("  ,  ")).toEqual([]);
  });

  it("trims, lowercases and drops empty entries", () => {
    expect(parseAllowlist(" A@Example.com , b@test.dev ,, ")).toEqual(["a@example.com", "b@test.dev"]);
  });
});

describe("isEmailAllowed", () => {
  it("allows everyone when the allowlist is empty (public mode)", () => {
    expect(isEmailAllowed("anyone@gmail.com", undefined)).toBe(true);
    expect(isEmailAllowed(null, "")).toBe(true);
  });

  it("matches addresses case-insensitively", () => {
    const list = "tester@gmail.com";
    expect(isEmailAllowed("Tester@Gmail.com", list)).toBe(true);
    expect(isEmailAllowed("  tester@gmail.com  ", list)).toBe(true);
  });

  it("rejects addresses outside the list", () => {
    expect(isEmailAllowed("stranger@gmail.com", "tester@gmail.com")).toBe(false);
  });

  it("rejects missing or malformed emails when a list is configured", () => {
    expect(isEmailAllowed(null, "tester@gmail.com")).toBe(false);
    expect(isEmailAllowed(undefined, "tester@gmail.com")).toBe(false);
    expect(isEmailAllowed("not-an-email", "tester@gmail.com")).toBe(false);
  });

  it("supports whole-domain entries", () => {
    expect(isEmailAllowed("anyone@mycompany.com", "@mycompany.com")).toBe(true);
    expect(isEmailAllowed("anyone@other.com", "@mycompany.com")).toBe(false);
  });

  it("does not let a domain entry match a lookalike address", () => {
    expect(isEmailAllowed("evil@notmycompany.com", "@mycompany.com")).toBe(false);
    expect(isEmailAllowed("mycompany.com@evil.com", "@mycompany.com")).toBe(false);
  });
});
