type MetaUnavailableNoticeProps = {
  context: "commander-page" | "card-section";
};

export function MetaUnavailableNotice({ context }: MetaUnavailableNoticeProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Popularity data not available
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {context === "commander-page"
          ? "This commander is in the catalog. Rank, salt, and deck stats will appear here once popularity data is synced."
          : "Deck stats and commander popularity for this card are not in the catalog yet."}
      </p>
    </section>
  );
}
