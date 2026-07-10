import { mapTagSlugsToClassification } from "@/lib/classification/tag-mapping";
import type { CardOverrideEntry, ClassificationResult } from "@/lib/classification/types";
import { uniqueSorted } from "@/lib/classification/types";

export function classifyFromOracleTags(tagSlugs: string[]): ClassificationResult {
  const { roles, themes } = mapTagSlugsToClassification(tagSlugs);
  return {
    roles,
    themes,
    tagSlugs: uniqueSorted(tagSlugs),
  };
}

export function classifyFromOverride(override: CardOverrideEntry): ClassificationResult {
  return {
    roles: override.roles ?? [],
    themes: override.themes ?? [],
    tagSlugs: [],
  };
}

export function hasClassification(result: ClassificationResult): boolean {
  return result.roles.length > 0 || result.themes.length > 0;
}
