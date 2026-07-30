/**
 * Warm the browser HTTP cache for a Scryfall (or other) image URL so a later
 * `next/image` mount can paint without waiting on the network.
 */
export function preloadImage(src: string | null | undefined): void {
  if (!src || typeof window === "undefined") return;
  const img = new window.Image();
  img.decoding = "async";
  img.src = src;
}

export function preloadImages(srcs: Array<string | null | undefined>): void {
  for (const src of srcs) {
    preloadImage(src);
  }
}
