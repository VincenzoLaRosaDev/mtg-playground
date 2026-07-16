import { CardsBrowseClient } from "@/app/cards/cards-browse-client";
import { queryCardsBrowse } from "@/lib/browse/cards";
import { getCardsBrowseDefaults } from "@/lib/browse/cards-defaults";
import { prisma } from "@/lib/db";

export default async function CardsPage() {
  const { window, toolbar, requestKey, queryParams } = getCardsBrowseDefaults();
  const initialData = await queryCardsBrowse(prisma, queryParams);

  return (
    <CardsBrowseClient
      initialData={initialData}
      initialWindow={window}
      initialToolbar={toolbar}
      initialRequestKey={requestKey}
    />
  );
}
