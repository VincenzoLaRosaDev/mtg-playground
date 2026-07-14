import { LoadingSpinner } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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
    <div className="mt-8 flex justify-center">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onClick}
        disabled={loading || disabled}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Loading…</span>
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}
