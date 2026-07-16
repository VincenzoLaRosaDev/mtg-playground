import { CatalogBrowseClient } from "@/app/catalog/catalog-browse-client";
import { queryCardsBrowse } from "@/lib/browse/cards";
import { getCatalogBrowseDefaults } from "@/lib/browse/catalog-defaults";
import { prisma } from "@/lib/db";

export default async function CatalogPage() {
  const { toolbar, requestKey, queryParams } = getCatalogBrowseDefaults();
  const initialData = await queryCardsBrowse(prisma, queryParams);

  return (
    <CatalogBrowseClient
      initialData={initialData}
      initialToolbar={toolbar}
      initialRequestKey={requestKey}
    />
  );
}
