import type { PrismaClient } from "@/generated/prisma/client";

import {
  FUNCTIONAL_ROLES,
  SYNERGY_THEMES,
  type FunctionalRole,
  type SynergyTheme,
} from "@/lib/classification/types";

/**
 * Roles/themes that appear on at least one `card_classifications` row,
 * intersected with the product enums (closed taxonomy).
 */
export async function listPresentClassificationFacets(prisma: PrismaClient): Promise<{
  roles: FunctionalRole[];
  themes: SynergyTheme[];
}> {
  const [roleRows, themeRows] = await Promise.all([
    prisma.$queryRaw<Array<{ value: string }>>`
      SELECT DISTINCT unnest(roles) AS value FROM card_classifications
    `,
    prisma.$queryRaw<Array<{ value: string }>>`
      SELECT DISTINCT unnest(themes) AS value FROM card_classifications
    `,
  ]);

  const presentRoles = new Set(roleRows.map((row) => row.value));
  const presentThemes = new Set(themeRows.map((row) => row.value));

  return {
    roles: FUNCTIONAL_ROLES.filter((role) => presentRoles.has(role)),
    themes: SYNERGY_THEMES.filter((theme) => presentThemes.has(theme)),
  };
}
