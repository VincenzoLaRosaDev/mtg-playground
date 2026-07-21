import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Scryfall set icons are black SVGs. Invert + opacity ≈ `muted-foreground`
 * (light text on dark UI) without baking a color into the asset.
 */
export const SET_ICON_IMAGE_CLASS =
  "object-contain brightness-0 invert opacity-[0.72]";

type SetIconProps = {
  src: string;
  /** Tailwind size classes for the box (default browse row). */
  className?: string;
};

export function SetIcon({ src, className }: SetIconProps) {
  return (
    <div className={cn("relative h-10 w-10 shrink-0", className)}>
      <Image src={src} alt="" fill className={SET_ICON_IMAGE_CLASS} unoptimized />
    </div>
  );
}
