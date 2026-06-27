import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal";
import {
  makeCanonicalLink,
  makeJsonLdScript,
  makePageMeta,
  SCHEMA,
} from "@/lib/seo";
import { SITE } from "@/lib/site";

const TITLE = "Support — LeafCue";
const DESCRIPTION =
  "Get help with LeafCue. Contact support, learn how reminders work, back up and move your data, and manage LeafCue Plus.";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: makePageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: "/support",
    }),
    links: [makeCanonicalLink("/support")],
    scripts: [
      makeJsonLdScript(
        SCHEMA.webPage({
          title: TITLE,
          description: DESCRIPTION,
          path: "/support",
        }),
      ),
    ],
  }),
  component: SupportPage,
});

const UPDATED = "16 June 2026";

function SupportPage() {
  return (
    <LegalShell
      title="Support"
      intro="Need a hand with LeafCue? Most answers are below — and a real person reads every email."
      updated={UPDATED}
    >
      <h2>Contact us</h2>
      <p>
        The fastest way to reach us is by email. Tell us your device (iPhone or
        Android) and what you were doing, and we’ll help.
      </p>
      <p>
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>

      <h2>Getting started</h2>
      <p>
        LeafCue works the moment you open it — no account, no sign-up. Add your
        first plant, give it a name and (optionally) pick a species, and LeafCue
        will suggest a care plan you can adjust. You can organise plants into
        rooms and shelves to match your home.
      </p>

      <h2>Reminders</h2>
      <p>
        LeafCue sends gentle local notifications on the day a plant is due for
        care, and respects quiet hours so it never buzzes overnight. If
        reminders aren’t arriving:
      </p>
      <ul>
        <li>
          Check that notifications are enabled for LeafCue in your device
          settings.
        </li>
        <li>Confirm reminders are turned on in the app’s reminder settings.</li>
        <li>
          Make sure your quiet-hours window isn’t covering the time you expect
          the reminder.
        </li>
      </ul>

      <h2>Backing up and moving your data</h2>
      <p>
        Because LeafCue is local-first, your data lives on your device. To keep
        a copy or move to a new phone, use the export feature in the app’s
        backup settings to save your library, then import it on the new device.
        We recommend exporting occasionally so you always have a backup you
        control.
      </p>

      <h2>LeafCue Plus and purchases</h2>
      <p>
        LeafCue Plus is an optional upgrade — a monthly or annual subscription,
        or a one-time Lifetime purchase — billed through the App Store or Google
        Play. To manage or cancel a subscription, use your App Store or Google
        Play account settings. If you’ve purchased Plus but don’t see its
        features — for example after reinstalling or switching devices — use the
        “Restore purchases” option in the app. If a subscription ends, all your
        existing plants and data remain available.
      </p>

      <h2>Privacy and your data</h2>
      <p>
        We don’t collect your plant data — it stays on your device. For the full
        details, see our <a href="/privacy">Privacy Policy</a> and{" "}
        <a href="/terms">Terms of Service</a>.
      </p>

      <h2>Still stuck?</h2>
      <p>
        Email us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> and
        we’ll do our best to help. {SITE.company} builds and supports LeafCue.
      </p>
    </LegalShell>
  );
}
