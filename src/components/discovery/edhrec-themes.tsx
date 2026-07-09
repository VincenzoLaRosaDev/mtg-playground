type EdhrecThemesProps = {
  tagCounts: Record<string, number>;
};

export function EdhrecThemes({ tagCounts }: EdhrecThemesProps) {
  const themes = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (themes.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Themes
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {themes.map(([name, count]) => (
          <li
            key={name}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            {name} · {count.toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
