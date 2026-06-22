import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal";
import {
  makeCanonicalLink,
  makeJsonLdScript,
  makePageMeta,
  SCHEMA,
} from "@/lib/seo";
import { SITE } from "@/lib/site";

const TITLE = "Terms of Service — LeafCue";
const DESCRIPTION =
  "The terms that govern your use of LeafCue, including LeafCue Plus subscriptions, your content, disclaimers and limitations of liability.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: makePageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: "/terms",
    }),
    links: [makeCanonicalLink("/terms")],
    scripts: [
      makeJsonLdScript(
        SCHEMA.webPage({
          title: TITLE,
          description: DESCRIPTION,
          path: "/terms",
        }),
      ),
    ],
  }),
  component: TermsPage,
});

const UPDATED = "16 June 2026";

function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These terms govern your use of the LeafCue app. By downloading or using LeafCue, you agree to them."
      updated={UPDATED}
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (“Terms”) are a legal agreement between you and{" "}
        {SITE.company} (“we”, “us”, “our”) regarding your use of the LeafCue
        mobile application and this website (together, “the Service”). By
        downloading, installing or using LeafCue, you agree to be bound by these
        Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>2. The Service</h2>
      <p>
        LeafCue is a local-first plant care tracker. It helps you record your
        plants, schedule and complete care tasks, receive optional local
        reminders, and keep photos, growth measurements, health notes and
        journal entries. Your data is stored locally on your device. The Service
        is provided for personal, non-commercial plant care use.
      </p>

      <h2>3. Licence to use</h2>
      <p>
        Subject to these Terms, we grant you a personal, non-exclusive,
        non-transferable, revocable licence to download and use LeafCue on
        devices you own or control, for your own use. You may not copy, modify,
        reverse-engineer, distribute, sell or sub-licence the app except as
        permitted by law or the applicable app-store terms.
      </p>

      <h2>4. Your responsibilities</h2>
      <ul>
        <li>Use LeafCue lawfully and only as intended.</li>
        <li>
          Keep your device secure; because your data is stored on-device, its
          safety depends on your device’s protection.
        </li>
        <li>
          Maintain your own backups of any data that matters to you, including
          via the app’s export feature.
        </li>
        <li>
          Do not attempt to disrupt, misuse, or gain unauthorised access to the
          Service.
        </li>
      </ul>

      <h2>5. LeafCue Plus subscriptions</h2>
      <p>
        LeafCue is free to use. LeafCue Plus is an optional, auto-renewing
        subscription that unlocks unlimited active plants and additional
        power-user features. The following apply:
      </p>
      <ul>
        <li>
          <strong>Billing.</strong> Subscriptions are purchased and billed
          through the Apple App Store or Google Play. Current pricing and
          billing periods (such as monthly or annual) are shown in the app at
          the point of purchase.
        </li>
        <li>
          <strong>Auto-renewal.</strong> Subscriptions renew automatically
          unless cancelled at least 24 hours before the end of the current
          period. You manage and cancel subscriptions in your App Store or
          Google Play account settings, not within LeafCue.
        </li>
        <li>
          <strong>Refunds.</strong> Refunds are handled by Apple or Google under
          their respective policies.
        </li>
        <li>
          <strong>If Plus ends.</strong> If LeafCue Plus lapses or is cancelled,
          your existing plants and all of their data remain fully visible,
          editable and exportable. Only creating or reactivating active plants
          beyond the free limit requires an active subscription.
        </li>
      </ul>

      <h2>6. Your content and data</h2>
      <p>
        You own the content you create in LeafCue. Because LeafCue is
        local-first, that content is stored on your device and we do not claim
        any ownership of it. You are responsible for your own backups. Deleting
        the app removes its local data from your device.
      </p>

      <h2>7. Plant care guidance — no professional advice</h2>
      <p>
        LeafCue provides general care suggestions, intervals and species
        information to help you organise plant care. This guidance is for
        informational purposes only and is provided “as is”. It is not
        professional horticultural, agricultural, medical or veterinary advice.
        Plant needs vary with environment, season and individual conditions.
        Information about plant toxicity is general and may be incomplete; if a
        person or animal may have ingested a plant, seek professional medical or
        veterinary help immediately. You are responsible for decisions you make
        about caring for your plants.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided on an “as is” and “as available” basis without
        warranties of any kind, whether express or implied, including but not
        limited to fitness for a particular purpose and non-infringement, to the
        fullest extent permitted by law. We do not warrant that the Service will
        be uninterrupted, error-free, or that reminders will always be delivered
        (local notifications depend on your device and its settings).
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.company} will not be
        liable for any indirect, incidental, special, consequential or punitive
        damages, or for any loss of data, plants, or profits, arising out of or
        related to your use of the Service. Nothing in these Terms limits
        liability that cannot be limited under applicable law. This does not
        affect your statutory rights as a consumer.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        The LeafCue name, logo, app design, and software are owned by{" "}
        {SITE.company} and protected by intellectual property laws. These Terms
        do not grant you any rights to our trademarks or branding.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using LeafCue at any time by deleting it from your device.
        We may suspend or discontinue the Service, or features of it, where
        reasonably necessary. Provisions that by their nature should survive
        termination (such as disclaimers and limitations of liability) will
        survive.
      </p>

      <h2>12. Changes to the Service and these Terms</h2>
      <p>
        We may update LeafCue and these Terms over time. When we make material
        changes to these Terms, we will update the “Last updated” date above.
        Your continued use of the Service after changes take effect constitutes
        acceptance of the updated Terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of England and Wales, without
        regard to conflict-of-law principles, and subject to any mandatory
        consumer-protection rights you have in your country of residence.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Contact {SITE.company} at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </LegalShell>
  );
}
