import { cn } from "@leafcue/ui/lib/utils";
import { SITE } from "@/lib/site";

/**
 * App Store + Google Play download badges.
 * NOTE: these are clean facsimiles for launch — replace with the official
 * downloadable badge artwork when finalizing brand assets. Links live in
 * `@/lib/site` (App Store URL is a placeholder until the listing is live).
 */

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

function PlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <path
        fill="#00d2ff"
        d="M48 59.5v393a4 4 0 0 0 6.8 2.9l187-198.4a4 4 0 0 0 0-5.6L54.8 56.6A4 4 0 0 0 48 59.5z"
      />
      <path
        fill="#ffbc00"
        d="m381.4 222.6-74.8-43.2-65.6 69.6 60.1 63.8 80.3-46.4a25 25 0 0 0 0-43.8z"
      />
      <path
        fill="#ff3a44"
        d="M306.6 179.4 99.2 59.6c-7.6-4.4-16.2-5-23.4-2.3l165.2 191.7z"
      />
      <path
        fill="#00e676"
        d="M75.8 454.7c7.2 2.7 15.8 2.1 23.4-2.3l207.4-119.8-65.6-69.6z"
      />
    </svg>
  );
}

function Badge({
  href,
  ariaLabel,
  top,
  bottom,
  icon,
}: {
  href: string;
  ariaLabel: string;
  top: string;
  bottom: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="group inline-flex h-[3.25rem] items-center gap-2.5 rounded-xl bg-foreground px-4 text-background no-underline outline-none ring-offset-2 ring-offset-background transition-[transform,background-color] duration-[160ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-spruce focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
    >
      <span className="grid size-6 shrink-0 place-items-center">{icon}</span>
      <span className="flex flex-col text-left leading-none">
        <span className="font-medium text-[0.625rem] tracking-wide opacity-80">
          {top}
        </span>
        <span className="font-display font-semibold text-base tracking-tight">
          {bottom}
        </span>
      </span>
    </a>
  );
}

export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Badge
        href={SITE.appStoreUrl}
        ariaLabel="Download LeafCue on the App Store"
        top="Download on the"
        bottom="App Store"
        icon={<AppleLogo className="size-5" />}
      />
      <Badge
        href={SITE.playStoreUrl}
        ariaLabel="Get LeafCue on Google Play"
        top="Get it on"
        bottom="Google Play"
        icon={<PlayLogo className="size-5" />}
      />
    </div>
  );
}
