type LoadMoreButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

export function LoadMoreButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Load more",
}: LoadMoreButtonProps) {
  if (disabled && !loading) {
    return null;
  }

  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading || disabled}
        className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        {loading ? "Loading..." : label}
      </button>
    </div>
  );
}
