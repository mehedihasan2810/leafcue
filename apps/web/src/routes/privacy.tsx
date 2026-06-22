import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal";
import {
  makeCanonicalLink,
  makeJsonLdScript,
  makePageMeta,
  SCHEMA,
} from "@/lib/seo";
import { SITE } from "@/lib/site";

const TITLE = "Privacy Policy — LeafCue";
const DESCRIPTION =
  "How LeafCue handles your data. LeafCue is local-first: your plants, photos and notes stay on your device. No account, no analytics, no third-party tracking.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: makePageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: "/privacy",
    }),
    links: [makeCanonicalLink("/privacy")],
    scripts: [
      makeJsonLdScript(
        SCHEMA.webPage({
          title: TITLE,
          description: DESCRIPTION,
          path: "/privacy",
        }),
      ),
    ],
  }),
  component: PrivacyPage,
});

const UPDATED = "16 June 2026";

function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="LeafCue is built privacy-first. Your plant care data lives on your device, not on our servers. This policy explains what that means in practice."
      updated={UPDATED}
    >
      <h2>Our approach</h2>
      <p>
        LeafCue (“the app”, “we”, “us”) is published by {SITE.company}. We
        designed LeafCue to be local-first and privacy-first: you do not need an
        account to use it, and the information you create — your plants, photos,
        schedules, journal entries and notes — is stored locally on your device.
        We do not require you to register, sign in, or hand over personal
        information to use the app.
      </p>

      <h2>Information we do not collect</h2>
      <p>
        We want to be clear about what LeafCue does <strong>not</strong> do:
      </p>
      <ul>
        <li>We do not require an account, email address, or password.</li>
        <li>
          We do not upload your plants, photos, journals or care history to our
          servers.
        </li>
        <li>
          We do not embed third-party advertising or behavioural-tracking SDKs
          in the app.
        </li>
        <li>
          We do not sell, rent or share your personal information with data
          brokers.
        </li>
      </ul>

      <h2>Information stored on your device</h2>
      <p>
        Everything you add to LeafCue is saved in a local database on your
        device, including plant profiles and nicknames, care schedules and
        reminders, completed care logs, photos you attach, growth measurements,
        health observations, journal entries, and room and shelf organisation.
        This data stays on your device unless you choose to move it — for
        example by using the app’s export feature, or through a device backup
        you control (such as iCloud or Google device backup, governed by Apple’s
        or Google’s own terms).
      </p>

      <h2>Device permissions</h2>
      <p>
        LeafCue only asks for permissions needed for features you choose to use:
      </p>
      <ul>
        <li>
          <strong>Camera</strong> — to photograph your plants. Photos you
          capture are stored on your device.
        </li>
        <li>
          <strong>Photo library</strong> — to attach existing photos to your
          plants. Selected photos stay on your device.
        </li>
        <li>
          <strong>Notifications</strong> — to send gentle, local reminders when
          a plant is due for care. Reminders are scheduled on-device and are
          always optional.
        </li>
      </ul>
      <p>
        You can grant or revoke any of these permissions at any time in your
        device settings. Declining a permission only disables the related
        feature; the rest of the app keeps working.
      </p>

      <h2>Subscriptions and payments</h2>
      <p>
        LeafCue offers an optional subscription, LeafCue Plus. Purchases and
        renewals are processed by the Apple App Store or Google Play, not by us.
        We never see or store your payment card details. To manage entitlements
        (to know whether LeafCue Plus is active on your device) we use a
        subscription-management provider, which may process a pseudonymous app
        user identifier and the purchase receipt issued by the app store. This
        is used solely to unlock the features you have paid for and is not used
        to build a profile of you.
      </p>

      <h2>This website</h2>
      <p>
        This marketing website ({SITE.url}) is served through a content delivery
        network and hosting provider (Cloudflare), which may process standard
        technical information such as your IP address and request metadata to
        deliver the site securely and reliably. We do not use this website to
        build advertising profiles. If we add optional, privacy-respecting usage
        analytics in the future, we will update this policy first.
      </p>

      <h2>Children’s privacy</h2>
      <p>
        LeafCue is a general-audience plant care app and is not directed at
        children under 13 (or the equivalent minimum age in your country). We do
        not knowingly collect personal information from children. Because the
        app does not collect personal data on our servers in the first place,
        there is nothing for us to retain.
      </p>

      <h2>Data security</h2>
      <p>
        Because your data stays on your device, its security is closely tied to
        your device’s own protections — your passcode, biometric lock and
        operating-system security. We recommend keeping your device updated and
        protected with a screen lock. If you export your data, the resulting
        file is your responsibility to store securely.
      </p>

      <h2>Your control over your data</h2>
      <p>
        You are in control at all times. You can edit or delete any plant,
        photo, log or note inside the app. You can export your full library and
        re-import it whenever you like. Deleting the app from your device
        removes the app’s local database and the data it contains. Because we do
        not hold your plant data on our servers, there is no separate account
        for us to delete.
      </p>

      <h2>International users</h2>
      <p>
        LeafCue is available internationally. Since your plant data is processed
        locally on your device, it is not transferred to us across borders. Any
        limited processing described above (such as app-store payment handling
        or website delivery) is carried out by the respective providers under
        their own terms and safeguards.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time, for example to
        reflect new features or legal requirements. When we make material
        changes, we will update the “Last updated” date above and, where
        appropriate, note the change in the app.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have any questions about this Privacy Policy or how LeafCue
        handles data, contact {SITE.company} at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
