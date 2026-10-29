import Link from "next/link";
import LegalPage from "../../components/server/LegalPage";
import {BRAND, PROGRAM, SUPPORT_EMAIL, SUPPORT_PHONE} from "../../lib/notify/optIn.mjs";

export const metadata = {
  title: "Privacy Policy | No Off Season",
  description: `How ${BRAND} collects, uses and protects your information, including SMS opt-in data.`,
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 29, 2026" section="privacy">
      <p>
        This Privacy Policy explains how {BRAND} (No Off Season, LLC, &ldquo;NOS,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us&rdquo;), a gym at 25620 Friendship Rd, Daphne, AL 36526,
        collects, uses and protects information when you visit trainnos.com, contact us, or
        take part in our text message program, {PROGRAM}.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Find Your Fit quiz:</strong> your first name, mobile number, your answers
          (for example goals, schedule and budget) and your consent to be contacted.
        </li>
        <li>
          <strong>{PROGRAM} opt-in:</strong> the name and mobile number of staff who opt in,
          the consent wording they agreed to, the date and time, and their browser type.
        </li>
        <li>
          <strong>Email sign-ups and testimonials:</strong> the name, email, text and photo
          you choose to send us.
        </li>
        <li>
          <strong>Site usage:</strong> pages visited, the link or campaign that brought you
          here, device type and approximate region, tied to random identifiers stored in your
          browser. We do not use these to identify you personally.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To respond to you and recommend the right training program.</li>
        <li>
          To send {PROGRAM}: text messages to our staff when a prospective client contacts
          the gym, so they can follow up quickly.
        </li>
        <li>To run, secure and improve our website.</li>
      </ul>

      <h2>SMS and mobile information</h2>
      <p>
        <strong>
          We do not sell or share your SMS opt-in data or personal information with third
          parties for marketing purposes.
        </strong>{" "}
        No mobile information will be shared with third parties or affiliates for marketing
        or promotional purposes. Text messaging originator opt-in data and consent are not
        shared with any third parties, except the service providers below that deliver
        messages on our behalf.
      </p>
      <p>
        Message frequency varies. Message and data rates may apply. Reply STOP to opt out at
        any time, or HELP for help. Details are in the SMS Terms section of our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We share information only with service providers that help us run the site and our
        messages, under their own privacy and security commitments: Supabase (database and
        file storage), Vercel (website hosting and analytics), Twilio (text message delivery)
        and Google (staff sign-in). We may also disclose information if the law requires it.
        We never sell personal information.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep lead and opt-in records while they are useful for following up with you or
        proving consent, and delete detailed site-usage records automatically after a set
        period. You can ask us to delete your information at any time.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Reply STOP to any text from us to stop receiving messages.</li>
        <li>
          Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call{" "}
          {SUPPORT_PHONE} to see, correct or delete the information we hold about you.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        Parents may tell us about a child athlete through our quiz. We do not knowingly
        collect information directly from children under 13.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We will post any changes on this page with a new &ldquo;Last updated&rdquo; date.
        Questions? Contact {BRAND} at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,{" "}
        {SUPPORT_PHONE}, or 25620 Friendship Rd, Daphne, AL 36526.
      </p>
    </LegalPage>
  );
}
