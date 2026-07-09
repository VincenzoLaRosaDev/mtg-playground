import Image from "next/image";

type CardImageProps = {
  src: string;
  alt: string;
  variant?: "thumbnail" | "detail";
};

const variantStyles = {
  thumbnail: "h-[62px] w-[44px]",
  detail: "aspect-[488/680] w-full max-w-[260px]",
} as const;

export function CardImage({ src, alt, variant = "thumbnail" }: CardImageProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800 ${variantStyles[variant]}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes={variant === "thumbnail" ? "44px" : "260px"}
        unoptimized
      />
    </div>
  );
}
