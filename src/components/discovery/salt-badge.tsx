import { SaltIcon } from "@/components/mtg/salt-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SaltBadgeProps = {
  salt: number | null;
  className?: string;
};

export function SaltBadge({ salt, className }: SaltBadgeProps) {
  if (salt == null) {
    return null;
  }

  const tone =
    salt >= 2
      ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
      : salt >= 1
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : undefined;

  return (
    <Badge
      variant={tone ? "outline" : "secondary"}
      title={`Salt ${salt.toFixed(2)}`}
      className={cn("gap-1 tabular-nums", tone, className)}
    >
      <SaltIcon />
      <span>{salt.toFixed(2)}</span>
      <span className="sr-only">Salt</span>
    </Badge>
  );
}
