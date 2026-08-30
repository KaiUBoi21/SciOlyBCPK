"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Roster" },
  { href: "/pairings", label: "Pairings" },
  { href: "/practice", label: "Practice" },
  { href: "/competitions", label: "Competitions" },
  { href: "/test-bank", label: "Test Bank" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-chart-rule bg-chart-ground-raised">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        <span className="font-mono text-xs font-medium tracking-[0.15em] text-chart-ink uppercase">
          BCP SciOly
        </span>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "border-b-2 pb-0.5 font-mono text-xs tracking-wide uppercase transition-colors " +
                  (active
                    ? "border-division-b text-chart-ink"
                    : "border-transparent text-chart-ink-muted hover:text-chart-ink")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            className="font-mono text-xs text-chart-ink-muted underline-offset-2 hover:text-chart-ink hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
