type FilterUnavailableNoticeProps = {
  message?: string;
};

export function FilterUnavailableNotice({ message }: FilterUnavailableNoticeProps) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
      <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
        Filtered popularity data not available
      </h2>
      <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">
        {message ??
          "EDHREC did not return data for this filter combination. Try another theme, budget, or bracket, or clear the filters."}
      </p>
    </section>
  );
}
