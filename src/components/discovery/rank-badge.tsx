import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RankBadgeProps = {
  rank: number | null;
  className?: string;
  title?: string;
};

export function RankBadge({ rank, className, title }: RankBadgeProps) {
  if (rank == null) {
    return null;
  }

  return (
    <Badge
      title={title}
      variant="default"
      className={cn("min-w-8 tabular-nums font-semibold", className)}
    >
      #{rank}
    </Badge>
  );
}
