import type { ReactNode } from "react";

/** Shared shell + typographic styling for legal / content pages. */
export function LegalShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-[clamp(1rem,4vw,1.5rem)] py-16 sm:py-20">
      <header className="border-border border-b pb-8">
        <h1 className="font-display font-semibold text-[clamp(2.25rem,5vw,3.25rem)] text-foreground leading-[1.05] tracking-tight [overflow-wrap:anywhere]">
          {title}
        </h1>
        <p className="mt-4 max-w-[58ch] text-lg text-muted-foreground leading-8">
          {intro}
        </p>
        <p className="mt-4 text-muted-foreground text-sm">
          Last updated: {updated}
        </p>
      </header>

      <div
        className={[
          "mt-10 text-foreground",
          "[&_h2]:mt-12 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-[1.6rem] [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:first:mt-0",
          "[&_h3]:mt-8 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-xl",
          "[&_p]:mt-4 [&_p]:max-w-[68ch] [&_p]:text-muted-foreground [&_p]:leading-7",
          "[&_ul]:mt-4 [&_ul]:flex [&_ul]:max-w-[68ch] [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-0",
          "[&_li]:relative [&_li]:pl-6 [&_li]:text-muted-foreground [&_li]:leading-7",
          "[&_li]:before:absolute [&_li]:before:top-3 [&_li]:before:left-1 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-brand",
          "[&_a]:font-medium [&_a]:text-brand-ink [&_a]:underline [&_a]:underline-offset-2",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
        ].join(" ")}
      >
        {children}
      </div>
    </article>
  );
}
