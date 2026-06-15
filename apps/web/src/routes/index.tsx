import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Camera,
  CircleSlash,
  Droplets,
  HeartPulse,
  Home,
  Leaf,
  LockKeyhole,
  NotebookPen,
  Ruler,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  UploadCloud,
  WifiOff,
} from "lucide-react";
import { DeviceFrame } from "@/components/device-frame";
import { StoreBadges } from "@/components/store-badges";
import {
  makeCanonicalLink,
  makeJsonLdScript,
  makePageMeta,
  SCHEMA,
} from "@/lib/seo";
import { SITE } from "@/lib/site";

const TITLE = "LeafCue — Calm, private plant care tracker for iPhone & Android";
const DESCRIPTION =
  "LeafCue is a calm, private, offline-first plant care tracker. See what each plant needs today, get gentle reminders, and keep every note on your device — no account required.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: makePageMeta({ title: TITLE, description: DESCRIPTION, path: "/" }),
    links: [makeCanonicalLink("/")],
    scripts: [makeJsonLdScript(SCHEMA.softwareApplication())],
  }),
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Tour />
      <FeatureBreadth />
      <PrivacyStory />
      <PlusSection />
      <Faq />
      <DownloadCta />
    </>
  );
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_85%_-10%,oklch(0.93_0.05_181)_0%,transparent_55%)]"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-[clamp(1rem,4vw,1.5rem)] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-20 lg:pb-28">
        <div className="lc-rise flex min-w-0 max-w-xl flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper-3 px-3 py-1 font-medium text-brand-ink text-xs">
            <Leaf className="size-3.5" /> Local-first plant care
          </span>
          <h1 className="mt-5 font-display font-semibold text-[clamp(2.5rem,6vw,4rem)] text-foreground leading-[1.02] tracking-tight [overflow-wrap:anywhere]">
            Quiet care for growing things.
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg text-muted-foreground leading-8">
            LeafCue remembers what every plant needs — watering, feeding, light,
            the lot — and nudges you gently on the day it’s due. A calm, private
            home for your whole collection, right on your phone.
          </p>
          <StoreBadges className="mt-8" />
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
            <ShieldCheck className="size-4 text-brand" />
            No account · Works offline · Free to start
          </p>
        </div>

        <div className="relative flex min-w-0 justify-center lg:justify-end">
          <div className="relative">
            <div className="lc-rise pointer-events-none absolute top-14 -left-28 hidden w-[13.5rem] -rotate-6 opacity-90 lg:block">
              <DeviceFrame src="/screens/plants.png" alt="" />
            </div>
            <div className="lc-rise relative z-10">
              <DeviceFrame
                src="/screens/today.png"
                alt="LeafCue Today screen showing the day’s plant care queue"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- Trust strip */

const TRUST = [
  {
    icon: WifiOff,
    title: "Offline-first",
    body: "Works from the first launch, with or without a connection.",
  },
  {
    icon: CircleSlash,
    title: "No account",
    body: "No sign-ups, passwords, or emails. Just open it and go.",
  },
  {
    icon: LockKeyhole,
    title: "Private by design",
    body: "Plants, photos, and notes live on your device — nowhere else.",
  },
  {
    icon: Sparkles,
    title: "Free to start",
    body: "The full app is free. Plus is an optional extra, not a wall.",
  },
];

function TrustStrip() {
  return (
    <section className="border-border border-y bg-paper-2">
      <div className="mx-auto grid max-w-6xl grid-cols-1 px-[clamp(1rem,4vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((item, i) => (
          <div
            key={item.title}
            className={`flex flex-col gap-2 py-7 lg:px-6 lg:first:pl-0 ${
              i > 0 ? "lg:border-border lg:border-l" : ""
            }`}
          >
            <span className="flex items-center gap-2 font-display font-semibold text-foreground text-lg">
              <item.icon className="size-5 text-brand" />
              {item.title}
            </span>
            <p className="text-muted-foreground text-sm leading-6">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Tour */

type TourItem = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  img: string;
  alt: string;
};

const TOUR: TourItem[] = [
  {
    eyebrow: "Today",
    title: "Open the app, see exactly what each plant needs.",
    body: "Your care queue is the first thing you see — what’s overdue, what’s due today, what’s coming up. Mark things done with one tap, snooze when life gets busy.",
    points: [
      "Overdue, due-today and upcoming, sorted for you",
      "One-tap done, or snooze to a better day",
      "A gentle health banner when a plant needs attention",
    ],
    img: "/screens/today.png",
    alt: "LeafCue Today screen with the care queue and overdue tasks",
  },
  {
    eyebrow: "Your library",
    title: "Your whole collection, organised the way you think.",
    body: "Search, filter and sort across every plant. Group them by room and shelf, flag your favourites, and switch between a roomy grid and a compact list.",
    points: [
      "Filter by favourites, due today, overdue or room",
      "Real photos so you recognise each plant at a glance",
      "Rooms and shelves that mirror your actual home",
    ],
    img: "/screens/plants.png",
    alt: "LeafCue plant library showing a grid of plants with photos",
  },
  {
    eyebrow: "The care engine",
    title: "A care plan that adapts to how you actually tend.",
    body: "LeafCue suggests cues from each plant’s species, light and pot — then quietly tunes the intervals as you log care. Tap “Why this cue?” and it shows its working.",
    points: [
      "Watering, feeding, misting, pruning, repotting and more",
      "Adaptive intervals that learn from your habits",
      "Every cue is explained, never a black box",
    ],
    img: "/screens/plant-detail.png",
    alt: "LeafCue plant detail showing the next care cue and care plan",
  },
  {
    eyebrow: "Calendar",
    title: "Plan the week. Never miss a watering.",
    body: "See the whole month at a glance, with overdue, upcoming and completed care marked on each day. Reminders arrive on the day a task is due — and respect your quiet hours.",
    points: [
      "Month view with overdue, upcoming and history",
      "Gentle local reminders, never overnight",
      "Tap any day to see and complete its tasks",
    ],
    img: "/screens/calendar.png",
    alt: "LeafCue calendar with the month grid and the day’s tasks",
  },
  {
    eyebrow: "Insights",
    title: "Gentle momentum, not guilt.",
    body: "A quiet read on how things are going: your care streak, watering consistency, the plants you tend most, and the ones that could use a little attention.",
    points: [
      "Care streak and watering consistency",
      "Most cared-for plants and recent milestones",
      "A nudge toward anything that’s been neglected",
    ],
    img: "/screens/insights.png",
    alt: "LeafCue insights screen with care streak and consistency",
  },
  {
    eyebrow: "The long view",
    title: "Watch them grow, season by season.",
    body: "Build a visual timeline for every plant — photos, growth measurements, health observations and journal notes, all woven into one history you can scroll back through.",
    points: [
      "Photo timeline and before/after comparisons",
      "Track height, leaves and blooms over time",
      "Log health issues and journal the good days",
    ],
    img: "/screens/timeline.png",
    alt: "LeafCue plant timeline with photos, growth and journal entries",
  },
];

function Tour() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-[clamp(1rem,4vw,1.5rem)] pt-20 sm:pt-24">
        <div className="max-w-2xl">
          <h2 className="text-balance font-display font-semibold text-[clamp(2rem,4vw,3rem)] text-foreground leading-[1.06] tracking-tight">
            Everything you need to keep them thriving.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-8">
            A guided tour of LeafCue, screen by screen. No marketing mock-ups —
            these are the real app.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-[clamp(1rem,4vw,1.5rem)] py-16 sm:gap-28 sm:py-20">
        {TOUR.map((item, i) => (
          <TourRow key={item.title} item={item} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function TourRow({ item, flip }: { item: TourItem; flip: boolean }) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div
        className={`flex min-w-0 flex-col items-start ${flip ? "lg:order-2" : ""}`}
      >
        <span className="inline-flex items-center gap-2.5 font-semibold text-brand-ink text-sm">
          <span className="h-px w-6 bg-brand/50" aria-hidden="true" />
          {item.eyebrow}
        </span>
        <h3 className="mt-3 text-balance font-display font-semibold text-[clamp(1.6rem,3vw,2.25rem)] text-foreground leading-[1.1] tracking-tight [overflow-wrap:anywhere]">
          {item.title}
        </h3>
        <p className="mt-4 max-w-[52ch] text-base text-muted-foreground leading-7">
          {item.body}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {item.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-[0.95rem] text-foreground leading-6"
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-brand-ink">
                <Leaf className="size-3" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`flex min-w-0 justify-center ${flip ? "lg:order-1" : ""}`}
      >
        <DeviceFrame src={item.img} alt={item.alt} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Feature breadth */

const FEATURES = [
  {
    icon: Camera,
    title: "Photo timeline",
    body: "Capture cover, growth and health photos and watch the story build.",
  },
  {
    icon: Ruler,
    title: "Growth tracking",
    body: "Log height, leaf count and blooms; see the trend on a sparkline.",
  },
  {
    icon: HeartPulse,
    title: "Health log",
    body: "Track pests, yellowing or wilting from first sign to recovered.",
  },
  {
    icon: NotebookPen,
    title: "Journal",
    body: "Notes, milestones and moods — a diary for every plant.",
  },
  {
    icon: Home,
    title: "Rooms & shelves",
    body: "Organise plants by where they actually live in your home.",
  },
  {
    icon: BellRing,
    title: "Reminders & quiet hours",
    body: "Nudges on the day a task is due, never in the middle of the night.",
  },
  {
    icon: Sprout,
    title: "Species presets",
    body: "Built-in care guidance for a wide library of common houseplants.",
  },
  {
    icon: Droplets,
    title: "Care profiles",
    body: "Light, water, toxicity, pot and soil — the details that matter.",
  },
  {
    icon: UploadCloud,
    title: "Export & import",
    body: "Your data is yours. Back it up and bring it with you, anytime.",
  },
];

function FeatureBreadth() {
  return (
    <section className="border-border border-t bg-paper-2">
      <div className="mx-auto max-w-6xl px-[clamp(1rem,4vw,1.5rem)] py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-balance font-display font-semibold text-[clamp(1.75rem,3.5vw,2.5rem)] text-foreground leading-[1.08] tracking-tight">
            And a lot more, quietly tucked in.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-8">
            LeafCue grows with your collection — from your first pot to a full
            indoor jungle.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 border-border border-t py-6"
            >
              <feature.icon className="mt-0.5 size-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-foreground text-lg">
                  {feature.title}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm leading-6">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Privacy story */

const PROMISES = [
  {
    title: "On-device only",
    body: "Plants, photos and journals live in a local database on your phone. Nothing is uploaded.",
  },
  {
    title: "No account required",
    body: "Skip sign-ups, passwords and emails. LeafCue works offline from the very first launch.",
  },
  {
    title: "Your data is yours",
    body: "No analytics, no ads, no third-party tracking. Export and re-import your whole library on your terms.",
  },
];

function PrivacyStory() {
  return (
    <section id="privacy" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-[clamp(1rem,4vw,1.5rem)] py-20 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper-3 px-3 py-1 font-medium text-brand-ink text-xs">
            <LockKeyhole className="size-3.5" /> Privacy model
          </span>
          <h2 className="mt-5 text-balance font-display font-semibold text-[clamp(2rem,4vw,3rem)] text-foreground leading-[1.04] tracking-tight">
            Private by design.
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg text-muted-foreground leading-8">
            LeafCue protects your plant care notes the same way it protects you
            — by keeping them with you.
          </p>
          <Link
            to="/privacy"
            className="group mt-6 inline-flex items-center gap-1.5 font-medium text-brand-ink no-underline outline-none focus-visible:underline"
          >
            Read our privacy policy
            <ArrowRight className="size-4 transition-transform duration-[160ms] group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ol className="flex min-w-0 flex-col gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {PROMISES.map((promise, i) => (
            <li
              key={promise.title}
              className="flex items-start gap-5 bg-paper-3 p-7"
            >
              <span className="font-display font-semibold text-2xl text-brand tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-foreground text-xl">
                  {promise.title}
                </h3>
                <p className="mt-1.5 text-[0.95rem] text-muted-foreground leading-6">
                  {promise.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Plus */

const FREE_LIST = [
  "Track unlimited care, photos, growth & health",
  "Gentle reminders with quiet hours",
  "Rooms, shelves, journal & insights",
  "Full export and import of your data",
];

const PLUS_LIST = [
  "Unlimited active plants",
  "Advanced local insights as they ship",
  "Support independent, ad-free development",
  "Keep all your data even if you cancel",
];

function PlusSection() {
  return (
    <section className="border-border border-t bg-paper-2">
      <div className="mx-auto max-w-6xl px-[clamp(1rem,4vw,1.5rem)] py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-balance font-display font-semibold text-[clamp(1.75rem,3.5vw,2.5rem)] text-foreground leading-[1.08] tracking-tight">
            LeafCue is free. Plus is optional.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-8">
            Everything you need to care for your plants is free. If you grow a
            jungle and want to support the app, LeafCue Plus is there.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PlanCard
            label="Always free"
            heading="The whole app"
            list={FREE_LIST}
            tone="paper"
          />
          <PlanCard
            label="LeafCue Plus"
            heading="Optional subscription"
            list={PLUS_LIST}
            tone="brand"
            note="See current pricing in the app — monthly or annual. Cancel anytime."
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  label,
  heading,
  list,
  tone,
  note,
}: {
  label: string;
  heading: string;
  list: string[];
  tone: "paper" | "brand";
  note?: string;
}) {
  const isBrand = tone === "brand";
  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 ${
        isBrand
          ? "border-transparent bg-spruce text-spruce-foreground"
          : "border-border bg-paper-3 text-foreground"
      }`}
    >
      <span
        className={`font-semibold text-xs uppercase tracking-[0.14em] ${
          isBrand ? "text-spruce-muted" : "text-brand-ink"
        }`}
      >
        {label}
      </span>
      <h3 className="mt-2 font-display font-semibold text-2xl tracking-tight">
        {heading}
      </h3>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {list.map((entry) => (
          <li
            key={entry}
            className="flex items-start gap-3 text-[0.95rem] leading-6"
          >
            <span
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                isBrand
                  ? "bg-brand text-primary-foreground"
                  : "bg-accent text-brand-ink"
              }`}
            >
              <Leaf className="size-3" />
            </span>
            {entry}
          </li>
        ))}
      </ul>
      {note ? (
        <p
          className={`mt-6 text-sm leading-6 ${
            isBrand ? "text-spruce-muted" : "text-muted-foreground"
          }`}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- FAQ */

const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. LeafCue works from the very first launch — no sign-up, no password, no email. There’s nothing to log into.",
  },
  {
    q: "Is my plant data private?",
    a: "Yes. Everything lives in a local database on your device. There are no analytics, no ads and no third-party trackers watching how you care for your plants.",
  },
  {
    q: "Does it really work offline?",
    a: "Completely. A missing connection never blocks your core plant care — reminders, notes and schedules are all on-device.",
  },
  {
    q: "Is LeafCue free?",
    a: "The full app is free. LeafCue Plus is an optional subscription that unlocks unlimited active plants and future power-user features — you can use LeafCue happily without it.",
  },
  {
    q: "What happens if LeafCue Plus expires?",
    a: "All of your plants and their data stay fully visible, editable and exportable. Only creating active plants beyond the free limit needs Plus.",
  },
  {
    q: "Which devices are supported?",
    a: "LeafCue is available for iPhone on the App Store and for Android on Google Play.",
  },
  {
    q: "How do reminders work?",
    a: "LeafCue sends gentle local notifications on the day a task is due, and respects quiet hours so it never buzzes overnight. Reminders are always optional.",
  },
  {
    q: "Can I get my data out?",
    a: "Yes. Export your whole library at any time and re-import it whenever you like. Your data belongs to you.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl px-[clamp(1rem,4vw,1.5rem)] py-20 sm:py-24">
        <h2 className="text-balance font-display font-semibold text-[clamp(2rem,4vw,3rem)] text-foreground leading-[1.06] tracking-tight">
          Questions, answered plainly.
        </h2>
        <div className="mt-10 flex flex-col">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-border border-t py-5 last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-foreground text-lg outline-none focus-visible:text-brand-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-brand transition-transform duration-[200ms] group-open:rotate-45">
                  <span className="text-lg leading-none">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-[60ch] text-[0.95rem] text-muted-foreground leading-7">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Download CTA */

function DownloadCta() {
  return (
    <section
      id="download"
      className="scroll-mt-20 px-[clamp(1rem,4vw,1.5rem)] pb-20 sm:pb-24"
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-paper-3 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_120%_at_50%_-20%,oklch(0.92_0.06_181)_0%,transparent_60%)]"
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-3 py-1 font-medium text-brand-ink text-xs">
          <Sun className="size-3.5" /> Start today
        </span>
        <h2 className="mx-auto mt-5 max-w-[18ch] text-balance font-display font-semibold text-[clamp(2rem,4.5vw,3.25rem)] text-foreground leading-[1.04] tracking-tight">
          Give your plants a calmer place to grow.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-lg text-muted-foreground leading-8">
          Download LeafCue and add your first plant in under a minute. No
          account, no clouds — just gentle reminders.
        </p>
        <StoreBadges className="mt-8 justify-center" />
        <p className="mt-5 text-muted-foreground text-sm">
          Free to start · {SITE.company}
        </p>
      </div>
    </section>
  );
}
