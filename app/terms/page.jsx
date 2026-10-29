import Link from "next/link";
import LegalPage from "../../components/server/LegalPage";
import {BRAND, PROGRAM, SUPPORT_EMAIL, SUPPORT_PHONE} from "../../lib/notify/optIn.mjs";

export const metadata = {
  title: "Terms & Conditions | No Off Season",
  description: `Terms for using the ${BRAND} website and the ${PROGRAM} text message program.`,
};

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="October 29, 2026" section="terms">
      <p>
        These Terms &amp; Conditions apply to trainnos.com and to text messages sent by{" "}
        {BRAND} (No Off Season, LLC, &ldquo;NOS,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By
        using the site or opting in to our messages, you agree to them.
      </p>

      <h2>Using the website</h2>
      <p>
        The site describes our gym and training programs. Program recommendations from the
        Find Your Fit quiz are a starting point, not medical advice; talk to a doctor before
        starting a new exercise program, especially if you have an injury. Memberships and
        bookings are handled through our booking provider and are governed by its terms and
        any membership agreement you sign with us.
      </p>
      <p>
        Content on the site, including photos and videos, belongs to {BRAND} or the people
        pictured and may not be reused without permission.
      </p>

      <h2 id="sms">SMS Terms</h2>
      <h3>Program</h3>
      <p>
        <strong>{PROGRAM}</strong> is a text message program run by {BRAND}. It sends our
        staff automated alerts when a prospective client submits the Find Your Fit quiz,
        including the person&rsquo;s first name, a summary of their answers, their phone
        number and a link to follow up, plus a reminder the next morning if no one has
        followed up yet. Staff opt in on our <Link href="/sms-alerts">{PROGRAM} page</Link>.
      </p>
      <h3>Message frequency</h3>
      <p>Message frequency varies, about 2 messages per new lead.</p>
      <h3>Costs</h3>
      <p>
        <strong>Message and data rates may apply.</strong> Check with your mobile carrier for
        details.
      </p>
      <h3>Opting out and help</h3>
      <p>
        Reply <strong>STOP</strong> to any message to stop receiving texts. You will get one
        confirmation and no further messages unless you opt in again. Reply{" "}
        <strong>HELP</strong> for help, or contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or {SUPPORT_PHONE}.
      </p>
      <h3>Carriers</h3>
      <p>
        Carriers are not liable for delayed or undelivered messages. Delivery depends on your
        carrier and device.
      </p>
      <h3>Privacy</h3>
      <p>
        We do not sell or share your SMS opt-in data or personal information with third
        parties for marketing purposes. See our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Limits on liability</h2>
      <p>
        The site is provided &ldquo;as is.&rdquo; To the extent the law allows, {BRAND} is not
        liable for indirect or incidental damages from using the site or our messages.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will post changes here with a new &ldquo;Last
        updated&rdquo; date. Questions? Contact {BRAND} at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, {SUPPORT_PHONE}, or 25620
        Friendship Rd, Daphne, AL 36526. These terms are governed by the laws of Alabama.
      </p>
    </LegalPage>
  );
}
