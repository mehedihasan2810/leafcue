import { Badge } from "@leafcue/ui/components/badge";
import { Button } from "@leafcue/ui/components/button";
import { Card, CardContent } from "@leafcue/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CloudOff,
  Database,
  Leaf,
  LockKeyhole,
  WifiOff,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const features = [
  {
    icon: WifiOff,
    title: "Offline by default",
    description:
      "Care schedules, notes, and plant profiles stay available even when the connection drops.",
  },
  {
    icon: LockKeyhole,
    title: "Private on purpose",
    description:
      "LeafCue is designed around local device storage instead of accounts and backend tracking.",
  },
  {
    icon: BellRing,
    title: "Care cues that fit",
    description:
      "Track watering, feeding, pruning, misting, rotations, and seasonal care without extra noise.",
  },
] as const;

function HomeComponent() {
  return (
    <main>
      <section className="border-border/70 border-b">
        <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:py-20">
          <div className="flex max-w-3xl flex-col gap-7">
            <Badge variant="secondary" className="w-fit">
              Local-first plant care
            </Badge>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-4xl text-balance font-semibold text-5xl leading-none tracking-normal sm:text-7xl">
                LeafCue
              </h1>
              <p className="max-w-2xl text-balance text-lg text-muted-foreground leading-8">
                A quiet, offline-first plant care tracker for remembering what
                each plant needs, without sending your home garden to a backend.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg">Coming Soon</Button>
              <Button
                size="lg"
                variant="outline"
                render={<a href="#features">See Features</a>}
              />
            </div>
          </div>

          <div className="relative">
            <div className="grid aspect-[4/5] max-h-[620px] min-h-[420px] overflow-hidden rounded-md border bg-[linear-gradient(160deg,hsl(var(--background))_0%,hsl(var(--muted))_62%,hsl(var(--accent))_100%)] p-5 shadow-sm">
              <div className="grid grid-rows-[auto_1fr_auto] rounded-md border bg-background p-4 shadow-xl">
                <div className="flex items-center justify-between border-border border-b pb-3">
                  <div>
                    <p className="font-medium text-sm">Today</p>
                    <p className="text-muted-foreground text-xs">
                      5 care cues ready offline
                    </p>
                  </div>
                  <CloudOff className="size-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col justify-center gap-3 py-6">
                  {[
                    ["Monstera", "Water check", "Moist soil"],
                    ["Calathea", "Mist leaves", "Morning"],
                    ["Snake Plant", "Skip watering", "Still dry-loving"],
                  ].map(([plant, task, note]) => (
                    <Card key={plant} size="sm">
                      <CardContent className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
                          <Leaf className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {plant}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {task} - {note}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 border-border border-t pt-3 text-center">
                  <Metric label="Plants" value="24" />
                  <Metric label="Due" value="5" />
                  <Metric label="Synced" value="0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="border-border/70 border-b py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <Badge variant="outline">Privacy model</Badge>
            <h2 className="mt-4 max-w-md text-balance font-semibold text-3xl leading-tight">
              Your plant notes belong on your device.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={Database}
              title="WatermelonDB storage"
              description="Native data is modeled locally first, with room for future sync if LeafCue ever needs it."
            />
            <InfoCard
              icon={CloudOff}
              title="No account required"
              description="The mobile app starts from no auth, no cookies, and no external backend dependency."
            />
          </div>
        </div>
      </section>

      <section id="features" className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-3">
            {features.map((feature) => (
              <InfoCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-lg">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CloudOff;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <span className="grid size-9 place-items-center rounded-md bg-secondary">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="font-medium text-base">{title}</h3>
          <p className="text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
