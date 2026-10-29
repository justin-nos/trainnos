import {supabaseAdmin} from "../supabase/admin";
import {leadAlertText, makeAlertCode} from "./leadMessage.mjs";
import {alertSendAt, reminderSendAt} from "./schedule.mjs";
import {recipients, cancelSms, sendSms} from "./twilio";

export const siteUrl = () => process.env.SITE_URL ?? "https://trainnos.com";

// Sends or schedules the alert and the next-morning reminder for every
// coach, then records the scheduled SIDs on the lead so a status change can
// cancel them. lead: {firstName, phone, answers, recommendation}.
export async function notifyNewLead(leadId, lead, now = new Date()) {
  const to = recipients();
  if (!to.length) {
    console.warn("LEAD_ALERT_RECIPIENTS is empty; no lead alerts sent");
    return;
  }
  const full = {...lead, id: leadId, createdAt: now.toISOString()};
  const alertAt = alertSendAt(now);
  const reminderAt = reminderSendAt(now);
  const alert = leadAlertText(full, {siteUrl: siteUrl()});
  const reminder = leadAlertText(full, {siteUrl: siteUrl(), reminder: true});

  const jobs = to.flatMap(({phone}) => [
    {scheduled: Boolean(alertAt), send: () => sendSms({to: phone, body: alert, sendAt: alertAt})},
    {scheduled: true, send: () => sendSms({to: phone, body: reminder, sendAt: reminderAt})},
  ]);
  const results = await Promise.allSettled(jobs.map(job => job.send()));
  const scheduled = results.flatMap((result, i) =>
    result.status === "fulfilled" && jobs[i].scheduled ? [result.value] : [],
  );
  const failed = results.filter(result => result.status === "rejected");
  for (const {reason} of failed) console.error("Lead alert SMS failed", reason);

  const {error} = await supabaseAdmin()
    .from("leads")
    .update({
      alert_code: makeAlertCode(leadId),
      alert_scheduled: scheduled,
      alert_sent_at: now.toISOString(),
      alert_failed: failed.length,
    })
    .eq("id", leadId);
  if (error) throw error;
}

// Cancels anything still scheduled for this lead. Safe to call repeatedly;
// SIDs that fail to cancel stay recorded so a later call can retry them.
export async function cancelLeadAlerts(leadId) {
  const supabase = supabaseAdmin();
  const {data, error} = await supabase
    .from("leads")
    .select("alert_scheduled")
    .eq("id", leadId)
    .maybeSingle();
  if (error) throw error;
  const sids = data?.alert_scheduled ?? [];
  if (!sids.length) return;
  const results = await Promise.allSettled(sids.map(cancelSms));
  const left = sids.filter((_, i) => results[i].status === "rejected");
  for (const result of results) {
    if (result.status === "rejected") console.error("Couldn't cancel lead alert", result.reason);
  }
  const {error: updateError} = await supabase
    .from("leads")
    .update({alert_scheduled: left})
    .eq("id", leadId);
  if (updateError) throw updateError;
}
