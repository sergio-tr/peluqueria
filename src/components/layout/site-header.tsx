import { HebraLine } from "@/components/brand/hebra-line";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
      <Link href="/" className="group flex flex-col gap-1">
        <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--color-charcoal)]">
          Peluquería Nowi
        </span>
        <HebraLine className="h-3 w-28 opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
      </Link>
      <nav className="flex items-center gap-4 text-sm text-[var(--color-charcoal)]/70">
        <Link href="/probar" className="transition-colors hover:text-[var(--color-copper)]">
          Probar un corte
        </Link>
        <Link href="/admin" className="transition-colors hover:text-[var(--color-copper)]">
          Panel
        </Link>
        <Link href="/privacidad" className="transition-colors hover:text-[var(--color-copper)]">
          Privacidad
        </Link>
      </nav>
    </header>
  );
}
