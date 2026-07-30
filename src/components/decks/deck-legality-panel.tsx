import type { DeckLegalityIssue } from "@/lib/decks/legality";
import { cn } from "@/lib/utils";

type DeckLegalityPanelProps = {
  ok: boolean;
  issues: DeckLegalityIssue[];
  className?: string;
};

/**
 * Blocking legality summary for the deck editor.
 * Empty list + ok → compact legal chip; otherwise lists errors.
 */
export function DeckLegalityPanel({
  ok,
  issues,
  className,
}: DeckLegalityPanelProps) {
  if (ok) {
    return (
      <p
        className={cn(
          "text-sm font-medium text-emerald-700 dark:text-emerald-400",
          className,
        )}
        role="status"
      >
        Legal for this format
      </p>
    );
  }

  if (issues.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2",
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">
        Not legal ({issues.length}{" "}
        {issues.length === 1 ? "issue" : "issues"})
      </p>
      <ul className="list-disc space-y-1 pl-4 text-sm text-destructive">
        {issues.slice(0, 12).map((issue, index) => (
          <li key={`${issue.code}-${issue.oracleId ?? ""}-${index}`}>
            {issue.message}
          </li>
        ))}
        {issues.length > 12 ? (
          <li>…and {issues.length - 12} more</li>
        ) : null}
      </ul>
    </div>
  );
}
