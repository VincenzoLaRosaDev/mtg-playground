import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CardsBrowseRedirectPage() {
  redirect("/browse?entity=cards");
}
