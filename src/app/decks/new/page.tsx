import { redirect } from "next/navigation";

/** Legacy create URL — creation is a sheet on `/decks`. */
export default function NewDeckPage() {
  redirect("/decks");
}
