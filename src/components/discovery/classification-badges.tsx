import type { CardClassificationSummary } from "@/lib/discovery/detail-pack";

type ClassificationBadgesProps = {
  classification: CardClassificationSummary | null;
};

function BadgeList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-md border border-border bg-background px-2 py-0.5 text-xs capitalize"
          >
            {value.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact roles/themes chips under the detail hero. */
export function ClassificationBadges({ classification }: ClassificationBadgesProps) {
  if (!classification) return null;
  if (classification.roles.length === 0 && classification.themes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <BadgeList label="Roles" values={classification.roles} />
      <BadgeList label="Themes" values={classification.themes} />
    </div>
  );
}
