import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PopularityUnavailableBadgeProps = {
  className?: string;
};

export function PopularityUnavailableBadge({ className }: PopularityUnavailableBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      Popularity data unavailable
    </Badge>
  );
}
