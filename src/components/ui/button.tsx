import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
};

export function Button({
  className,
  variant = "primary",
  href,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const styles = cn(
    "inline-flex items-center justify-center rounded-sm px-5 py-3 text-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-copper)] disabled:opacity-50",
    variant === "primary" &&
      "bg-[var(--color-copper)] text-[var(--color-ivory)] hover:bg-[var(--color-copper-deep)]",
    variant === "secondary" &&
      "border border-[var(--color-charcoal)]/20 bg-transparent text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]/40",
    variant === "ghost" && "text-[var(--color-charcoal)] hover:text-[var(--color-copper)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  );
}
