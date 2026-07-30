import type { DeckInsights } from "@/lib/decks/insights";
import { cn } from "@/lib/utils";

type DeckInsightsPanelProps = {
  insights: DeckInsights;
  className?: string;
};

/**
 * Compact builder insights: GC, role/theme counts, optional skeleton.
 */
export function DeckInsightsPanel({
  insights,
  className,
}: DeckInsightsPanelProps) {
  if (insights.countedCopies === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Insights appear once the main deck has cards.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2",
        className,
      )}
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">Game changers</span>{" "}
          <span className="font-medium tabular-nums">
            {insights.gameChangerCount}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          Main + commander · {insights.countedCopies}{" "}
          {insights.countedCopies === 1 ? "copy" : "copies"}
        </span>
      </div>

      {insights.roleCounts.length > 0 ? (
        <FacetList title="Roles" items={insights.roleCounts} />
      ) : null}

      {insights.themeCounts.length > 0 ? (
        <FacetList title="Themes" items={insights.themeCounts} />
      ) : null}

      {insights.skeleton && insights.skeleton.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Build skeleton
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {insights.skeleton.map((row) => (
              <li
                key={row.key}
                className="flex items-baseline justify-between gap-2 text-sm"
              >
                <span>{row.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    row.inDeck >= row.target
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {row.inDeck}/{row.target}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FacetList({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string; count: number }[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {items.map((item) => (
          <li key={item.key}>
            <span className="capitalize">{item.label}</span>{" "}
            <span className="tabular-nums text-muted-foreground">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
