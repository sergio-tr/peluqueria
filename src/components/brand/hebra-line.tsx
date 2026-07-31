import { cn } from "@/lib/cn";

type HebraLineProps = {
  className?: string;
  decorative?: boolean;
};

/** Abstract hair-strand line used as brand mark, divider and progress accent. */
export function HebraLine({ className, decorative = true }: HebraLineProps) {
  return (
    <svg
      viewBox="0 0 320 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-full text-[var(--color-copper)]", className)}
      aria-hidden={decorative}
      role={decorative ? undefined : "img"}
    >
      {!decorative ? <title>Hebra</title> : null}
      <path
        d="M2 14C28 4 48 20 74 12C100 4 118 18 146 11C174 4 192 19 220 12C248 5 268 18 318 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 18C36 10 56 22 86 15C116 8 136 21 168 14C200 7 220 20 250 13C280 6 296 17 318 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.45"
        strokeLinecap="round"
      />
    </svg>
  );
}
