import { Link } from "@tanstack/react-router";
import { NAV_LINKS, SITE } from "@/lib/site";

/** A small hand-built leaf mark — the brand glyph (kept separate from the
 * Lucide icon set used for feature content). */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M20.5 3.5c0 8.4-4.9 14.6-13 14.6-1.2 0-2.4-.2-3.5-.5C5.4 9.9 11 4.2 20.5 3.5z"
        opacity="0.95"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M4 20.5C5.5 13 9.5 8.8 16 6.2"
      />
    </svg>
  );
}

/**
 * Site header — N9 edge-aligned minimal.
 * Wordmark hard-left, a slim anchor cluster (hidden < 48rem), single CTA right.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-border/60 border-b bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-[clamp(1rem,4vw,1.5rem)]">
        <Link
          to="/"
          className="flex items-center gap-2 no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          aria-label={`${SITE.name} home`}
        >
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-primary-foreground">
            <LeafMark className="size-5" />
          </span>
          <span className="font-display font-semibold text-foreground text-xl tracking-tight">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap font-medium text-muted-foreground text-sm no-underline outline-none transition-colors duration-[160ms] hover:text-foreground focus-visible:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="/#download"
          className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-brand px-4 font-semibold text-primary-foreground text-sm no-underline outline-none ring-offset-2 ring-offset-paper transition-[transform,background-color] duration-[160ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-brand-ink focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
        >
          Get the app
        </a>
      </div>
    </header>
  );
}
