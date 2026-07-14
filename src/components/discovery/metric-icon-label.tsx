import { Layers, Link2, Percent } from "lucide-react";
import type { ReactNode } from "react";

type MetricIconLabelProps = {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

export function MetricIconLabel({
  icon,
  children,
  className = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums text-xs text-muted-foreground",
}: MetricIconLabelProps) {
  return (
    <span className={className}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

export function InclusionMetricLabel({ value }: { value: string }) {
  return (
    <MetricIconLabel icon={<Percent className="h-3 w-3" aria-hidden />}>
      {value}
    </MetricIconLabel>
  );
}

export function SynergyMetricLabel({ value }: { value: string }) {
  return (
    <MetricIconLabel icon={<Link2 className="h-3 w-3" aria-hidden />}>
      {value} synergy
    </MetricIconLabel>
  );
}

export function DecksMetricLabel({ value }: { value: string }) {
  return (
    <MetricIconLabel icon={<Layers className="h-3 w-3" aria-hidden />}>
      {value} decks
    </MetricIconLabel>
  );
}
