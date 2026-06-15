import { Link } from "@tanstack/react-router";
import { LeafMark } from "@/components/header";
import { StoreBadges } from "@/components/store-badges";
import { SITE } from "@/lib/site";

const FOOT_LINKS = [
  { label: "Features", href: "/#features", external: false },
  { label: "Privacy", href: "/privacy", external: false },
  { label: "Terms", href: "/terms", external: false },
  { label: "Support", href: "/support", external: false },
];

/** Footer — Ft5 Statement: a closing display sentence over a deep spruce band,
 * with the mast (wordmark · store badges · links · company) beneath. */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-spruce text-spruce-foreground">
      <div className="mx-auto max-w-6xl px-[clamp(1rem,4vw,1.5rem)] py-16 sm:py-20">
        <p className="max-w-[16ch] text-balance font-display font-semibold text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] tracking-tight">
          Quiet care for growing things.
        </p>

        <div className="mt-12 flex flex-col gap-10 border-white/10 border-t pt-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-brand text-primary-foreground">
                <LeafMark className="size-5" />
              </span>
              <span className="font-display font-semibold text-xl tracking-tight">
                {SITE.name}
              </span>
            </div>
            <p className="mt-4 text-sm text-spruce-muted leading-6">
              A local-first, privacy-first plant care companion. No account, no
              cloud — your plants stay on your device.
            </p>
            <StoreBadges className="mt-6" />
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3" aria-label="Footer">
            {FOOT_LINKS.map((link) =>
              link.href.startsWith("/#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap font-medium text-sm text-spruce-muted no-underline transition-colors duration-[160ms] hover:text-spruce-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="whitespace-nowrap font-medium text-sm text-spruce-muted no-underline transition-colors duration-[160ms] hover:text-spruce-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="whitespace-nowrap font-medium text-sm text-spruce-muted no-underline transition-colors duration-[160ms] hover:text-spruce-foreground"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-white/10 border-t pt-6 text-spruce-muted text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.company}. All rights reserved.
          </p>
          <p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="no-underline transition-colors hover:text-spruce-foreground"
            >
              {SITE.contactEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
