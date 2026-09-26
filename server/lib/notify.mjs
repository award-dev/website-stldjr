// Customer and company notifications. Each channel is optional and reports
// whether it actually sent — the booking UI only claims what happened.
//
//   Email: Resend (RESEND_API_KEY, EMAIL_FROM, COMPANY_NOTIFY_EMAIL)
//   SMS:   Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, COMPANY_NOTIFY_SMS)

import { env } from "./config.mjs";

async function sendEmail({ to, subject, text, html, attachments, replyTo }, fetchImpl) {
  if (!env("RESEND_API_KEY") || !env("EMAIL_FROM")) return { sent: false, reason: "email_unconfigured" };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env("EMAIL_FROM"), to: [to], subject, text, html, attachments, reply_to: replyTo }),
    });
    if (!res.ok) return { sent: false, reason: `email_http_${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: "email_network" };
  }
}

async function sendSms({ to, body }, fetchImpl) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const auth = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM");
  if (!sid || !auth || !from || !to) return { sent: false, reason: "sms_unconfigured" };
  try {
    const res = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        authorization: "Basic " + Buffer.from(`${sid}:${auth}`).toString("base64"),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 600) }),
    });
    return res.ok ? { sent: true } : { sent: false, reason: `sms_http_${res.status}` };
  } catch {
    return { sent: false, reason: "sms_network" };
  }
}

const escHtml = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function htmlEmail(heading, rows, footer) {
  const body = rows
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#6b6a66;font:13px/1.4 system-ui,sans-serif;vertical-align:top;white-space:nowrap">${escHtml(k)}</td><td style="padding:6px 0;color:#141413;font:15px/1.4 system-ui,sans-serif">${escHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("");
  return `<div style="background:#f4f2ee;padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px"><h1 style="margin:0 0 20px;font:600 22px/1.2 system-ui,sans-serif;color:#141413">${escHtml(heading)}</h1><table style="border-collapse:collapse;width:100%">${body}</table><p style="margin:24px 0 0;font:14px/1.5 system-ui,sans-serif;color:#141413">${footer}</p></div></div>`;
}

export function createNotifier({ business, fetchImpl = fetch } = {}) {
  const companyEmail = env("COMPANY_NOTIFY_EMAIL") || business.notifyEmail || business.email;
  const companySms = env("COMPANY_NOTIFY_SMS");

  return {
    /** kind: "confirmed" | "rescheduled" | "cancelled" */
    async booking(kind, summary) {
      const { rows, customerEmail, manageUrl, ics, headline, smsLine } = summary;
      const subjects = {
        confirmed: `You're booked: ${headline}`,
        rescheduled: `New time: ${headline}`,
        cancelled: `Cancelled: ${headline}`,
      };
      const lead = {
        confirmed: "You're on the schedule.",
        rescheduled: "Your booking has a new time.",
        cancelled: "Your booking is cancelled.",
      }[kind];
      const text = [lead, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", kind === "cancelled" ? "" : `Reschedule or cancel: ${manageUrl}`, `Questions? Call ${business.phoneDisplay}.`].join("\n");
      const footer =
        (kind === "cancelled" ? "" : `<a href="${escHtml(manageUrl)}" style="color:#147a34">Reschedule or cancel</a> · `) +
        `Questions? Call <a href="tel:${business.phone}" style="color:#147a34">${escHtml(business.phoneDisplay)}</a>.`;
      const attachments = ics && kind !== "cancelled" ? [{ filename: "stl-booking.ics", content: Buffer.from(ics).toString("base64") }] : undefined;

      const [customer, company, sms] = await Promise.all([
        sendEmail({ to: customerEmail, subject: subjects[kind], text, html: htmlEmail(lead, rows, footer), attachments, replyTo: business.email }, fetchImpl),
        sendEmail({ to: companyEmail, subject: `[Website booking ${kind}] ${headline}`, text: text.replace(lead, `Booking ${kind} via website.`), html: htmlEmail(`Booking ${kind}`, rows, `<a href="${escHtml(manageUrl)}">Manage</a>`), replyTo: customerEmail }, fetchImpl),
        sendSms({ to: companySms, body: `Website booking ${kind}: ${smsLine}` }, fetchImpl),
      ]);
      return { customerEmail: customer, companyEmail: company, companySms: sms };
    },
  };
}
