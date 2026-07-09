type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
