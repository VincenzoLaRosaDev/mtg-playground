import { CommandersBrowseClient } from "@/app/commanders/commanders-browse-client";
import { queryCommandersBrowse } from "@/lib/browse/commanders";
import { getCommandersBrowseDefaults } from "@/lib/browse/commanders-defaults";
import { prisma } from "@/lib/db";

export default async function CommandersPage() {
  const { window, toolbar, requestKey, queryParams } = getCommandersBrowseDefaults();
  const initialData = await queryCommandersBrowse(prisma, queryParams);

  return (
    <CommandersBrowseClient
      initialData={initialData}
      initialWindow={window}
      initialToolbar={toolbar}
      initialRequestKey={requestKey}
    />
  );
}
