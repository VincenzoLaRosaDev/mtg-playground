type EdhrecSectionProps = {
  title?: string;
  message?: string;
};

export function EdhrecSection({
  title = "EDHREC data",
  message = "Meta stats and popularity data will appear here after the EDHREC sync is wired up.",
}: EdhrecSectionProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
    </section>
  );
}
