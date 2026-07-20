import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy path — Phase 1.7 catalog alias. */
export default function CatalogRedirectPage() {
  redirect("/browse?entity=cards");
}
