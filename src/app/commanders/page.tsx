import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CommandersBrowseRedirectPage() {
  redirect("/browse?commanders_only=true");
}
