import Link from "next/link";
import SmsOptInForm from "../../components/client/SmsOptInForm";
import LegalPage from "../../components/server/LegalPage";
import {BRAND, PROGRAM, SUPPORT_EMAIL, SUPPORT_PHONE} from "../../lib/notify/optIn.mjs";

export const metadata = {
  title: `${PROGRAM} | No Off Season`,
  description: `Staff opt-in for ${PROGRAM}, text message alerts from ${BRAND} about new leads.`,
};

export default function SmsAlerts() {
  return (
    <LegalPage title={PROGRAM} section="sms-alerts">
      <p>
        {PROGRAM} are text messages from {BRAND} to our coaches and staff. When a
        prospective client finishes the Find Your Fit quiz on our website, opted-in staff get
        a text with the person&rsquo;s first name, a summary of what they&rsquo;re looking
        for, their phone number and a link to follow up. If the lead is still waiting the
        next morning, one reminder follows. Replying DONE marks the lead as contacted.
      </p>
      <ul>
        <li>For {BRAND} staff only. These are not marketing messages.</li>
        <li>Message frequency varies, about 2 messages per new lead.</li>
        <li>Message and data rates may apply.</li>
        <li>Reply STOP at any time to opt out, or HELP for help.</li>
      </ul>

      <h2>Opt in</h2>
      <SmsOptInForm />

      <p>
        Questions? Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or{" "}
        {SUPPORT_PHONE}. Read our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms#sms">SMS Terms</Link>.
      </p>
    </LegalPage>
  );
}
