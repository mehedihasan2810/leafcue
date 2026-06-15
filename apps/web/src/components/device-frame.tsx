import { cn } from "@leafcue/ui/lib/utils";

/**
 * A minimal iPhone 17 Pro device frame wrapping a REAL app screenshot.
 * The screenshots already carry the device status bar + Dynamic Island, so the
 * frame only supplies a titanium bezel + rounded screen + soft shadow — no
 * re-drawn chrome (no fake island/notch is painted on top).
 */
export function DeviceFrame({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-[17.5rem]", className)}>
      <div className="relative rounded-[2.75rem] bg-[oklch(0.28_0.012_181)] p-[0.5rem] shadow-[0_34px_70px_-24px_oklch(0.32_0.05_181_/_0.55),0_10px_24px_-12px_oklch(0.32_0.05_181_/_0.35)] ring-1 ring-black/15">
        {/* titanium edge highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[2.75rem] ring-1 ring-white/10 ring-inset" />
        <div className="overflow-hidden rounded-[2.3rem] bg-black">
          <img
            src={src}
            alt={alt}
            width={820}
            height={1782}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
