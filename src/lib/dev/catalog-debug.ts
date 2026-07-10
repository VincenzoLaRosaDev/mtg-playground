export function isCatalogDebugEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
