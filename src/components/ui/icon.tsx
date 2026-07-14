import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const sizeClassName = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

type IconProps = {
  icon: LucideIcon;
  size?: keyof typeof sizeClassName;
  className?: string;
  label?: string;
};

export function Icon({ icon: IconComponent, size = "md", className = "", label }: IconProps) {
  return (
    <IconComponent
      className={`shrink-0 ${sizeClassName[size]} ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}

export function LoadingSpinner({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: keyof typeof sizeClassName;
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      className={`animate-spin ${sizeClassName[size]} ${className}`}
      aria-label={label}
      role="status"
    />
  );
}
