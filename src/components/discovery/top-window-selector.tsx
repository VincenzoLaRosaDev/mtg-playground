import {
  EDHREC_CARD_TOP_WINDOW_OPTIONS,
  EDHREC_TOP_WINDOW_OPTIONS,
  type EdhrecTopWindowParam,
} from "@/lib/edhrec/top-window";
import { Label } from "@/components/ui/label";
import { browseToolbarInputClassName } from "@/components/discovery/browse-toolbar-shared";
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
  const fieldId = "top-window-select";

  return (
    <div className={cn("min-w-[12rem] space-y-1.5", className)}>
      <Label htmlFor={fieldId}>Time window</Label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value as EdhrecTopWindowParam)}
        className={cn(browseToolbarInputClassName, "min-w-[10rem]")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
