import { cn } from "@leafcue/ui/lib/utils";

/**
 * Renders a pre-composited device shot — each image in /screens is the real app
 * screenshot already baked into the titanium iPhone frame (1022×2082, with
 * transparent rounded corners). So this is just a plain image; no overlay or
 * redrawn chrome.
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
    <img
      src={src}
      alt={alt}
      width={1022}
      height={2082}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn(
        "mx-auto block h-auto w-full max-w-[17.5rem] select-none",
        className,
      )}
    />
  );
}
