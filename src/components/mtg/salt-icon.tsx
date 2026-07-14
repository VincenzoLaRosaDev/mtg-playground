type SaltIconProps = {
  className?: string;
};

export function SaltIcon({ className = "h-3.5 w-3.5" }: SaltIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 3h8l1 4H7l1-4Z" />
      <path d="M7 7h10v2c0 4-2 6-5 12-3-6-5-8-5-12V7Z" />
      <path d="M9.5 11h1M12 11h1M14.5 11h1" />
    </svg>
  );
}
