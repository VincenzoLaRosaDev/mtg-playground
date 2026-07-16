"use client";

import { BrowseSelectField } from "@/components/discovery/browse-filter-controls";
import {
  EDHREC_CARD_TOP_WINDOW_OPTIONS,
  EDHREC_TOP_WINDOW_OPTIONS,
  type EdhrecTopWindowParam,
} from "@/lib/edhrec/top-window";
import { cn } from "@/lib/utils";

type TopWindowSelectorProps = {
  value: EdhrecTopWindowParam;
  onChange: (window: EdhrecTopWindowParam) => void;
  /** When false, omits All time (card top browse — no EDHREC all-time top JSON). */
  includeAllTime?: boolean;
  className?: string;
};

export function TopWindowSelector({
  value,
  onChange,
  includeAllTime = true,
  className,
}: TopWindowSelectorProps) {
  const options = includeAllTime ? EDHREC_TOP_WINDOW_OPTIONS : EDHREC_CARD_TOP_WINDOW_OPTIONS;

  return (
    <BrowseSelectField
      label="Time window"
      value={value}
      onChange={(next) => onChange(next as EdhrecTopWindowParam)}
      options={options}
      className={cn("min-w-48", className)}
    />
  );
}
