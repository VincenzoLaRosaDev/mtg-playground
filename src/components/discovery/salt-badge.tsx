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
      ? "border-destructive/50 bg-destructive/15 text-destructive"
      : salt >= 1
        ? "border-warning/50 bg-warning/15 text-warning-foreground"
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
