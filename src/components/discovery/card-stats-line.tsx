import { ColorIdentity } from "@/components/mtg/color-identity";

type CardStatsLineProps = {
  cmc: number;
  colorIdentity: string[];
  isCommander?: boolean;
  className?: string;
};

export function CardStatsLine({
  cmc,
  colorIdentity,
  isCommander = false,
  className = "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground",
}: CardStatsLineProps) {
  return (
    <p className={className}>
      <span>CMC {cmc}</span>
      <ColorIdentity colors={colorIdentity} size="sm" />
      {isCommander ? <span>Commander</span> : null}
    </p>
  );
}
