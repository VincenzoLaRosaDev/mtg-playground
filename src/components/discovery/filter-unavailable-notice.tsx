import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FilterUnavailableNoticeProps = {
  message?: string;
};

export function FilterUnavailableNotice({ message }: FilterUnavailableNoticeProps) {
  return (
    <Alert variant="warning">
      <AlertTitle>Filtered popularity data not available</AlertTitle>
      <AlertDescription>
        {message ??
          "EDHREC did not return data for this filter combination. Try another theme, budget, or bracket, or clear the filters."}
      </AlertDescription>
    </Alert>
  );
}
