// backend/utils/notify.js
const nodemailer = require("nodemailer");
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "nirshuxcom@gmail.com";
const FROM_NAME = "Nirshux Terminal";
const CLIENT_URL = (process.env.CLIENT_URL || "https://nirshux.online").replace(
  /\/+$/,
  "",
);
const SMTP_TIMEOUT_MS = 8000;
const PUSH_TIMEOUT_MS = 10000;

// Strips whitespace, newlines and wrapping quotes that hosting dashboards often add.
const cleanEnv = (v) =>
  String(v || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();

// A bad push config must NEVER crash the server (it would take login down with it).
// If setup fails, push is simply disabled and everything else keeps working.
let pushReady = false;
let pushError = "";
let vapidPublicClean = "";
try {
  const vapidPublic = cleanEnv(process.env.VAPID_PUBLIC_KEY);
  const vapidPrivate = cleanEnv(process.env.VAPID_PRIVATE_KEY);
  const vapidSubject = cleanEnv(process.env.VAPID_SUBJECT) || `mailto:${ADMIN_EMAIL}`;

  if (!vapidPublic || !vapidPrivate) {
    const missing = [
      !vapidPublic && "VAPID_PUBLIC_KEY",
      !vapidPrivate && "VAPID_PRIVATE_KEY",
    ].filter(Boolean);
    pushError = `${missing.join(" + ")} not set on the server`;
    console.warn(`⚠️ ${pushError} — push notifications disabled`);
  } else {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    pushReady = true;
    vapidPublicClean = vapidPublic;
  }
} catch (err) {
  pushReady = false;
  pushError = err.message;
  console.error("⚠️ VAPID setup failed — push disabled:", err.message);
}

// Used by the admin route so the browser always gets the exact key the server validated.
const getPushStatus = () => ({ ready: pushReady, key: vapidPublicClean, error: pushError });

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clip = (s, n) => {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const nowLabel = () =>
  `${new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} WAT`;

// ───────────────────────── GMAIL SMTP ─────────────────────────
// App passwords are shown with spaces by Google — strip them just in case.
const getPass = () =>
  String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

const baseOptions = () => ({
  host: "smtp.gmail.com",
  family: 4, // force IPv4 — IPv6 routes to Gmail commonly time out on hosts
  connectionTimeout: SMTP_TIMEOUT_MS,
  greetingTimeout: SMTP_TIMEOUT_MS,
  socketTimeout: SMTP_TIMEOUT_MS * 2,
  auth: { user: ADMIN_EMAIL, pass: getPass() },
});

// Tried in order. The port that last worked is moved to the front.
const PROFILES = [
  { name: "465", options: { port: 465, secure: true } },
  { name: "587", options: { port: 587, secure: false, requireTLS: true } },
];

const transports = new Map();
let preferred = null;
let lastMailError = null;

const getTransport = (profile) => {
  if (!transports.has(profile.name)) {
    transports.set(
      profile.name,
      nodemailer.createTransport({ ...baseOptions(), ...profile.options }),
    );
  }
  return transports.get(profile.name);
};

const orderedProfiles = () =>
  preferred
    ? [...PROFILES].sort((a, b) =>
        a.name === preferred ? -1 : b.name === preferred ? 1 : 0,
      )
    : PROFILES;

// Never throws. Returns true/false. Always `await` it (serverless freezes after response).
const sendMail = async ({ to, subject, html }) => {
  if (!to) return false;
  if (!getPass()) {
    lastMailError = "GMAIL_APP_PASSWORD is not set";
    console.error("📧", lastMailError);
    return false;
  }

  const errors = [];
  for (const profile of orderedProfiles()) {
    try {
      await getTransport(profile).sendMail({
        from: `"${FROM_NAME}" <${ADMIN_EMAIL}>`,
        to,
        subject,
        html,
      });
      preferred = profile.name;
      lastMailError = null;
      return true;
    } catch (err) {
      const detail =
        `${err.code || ""} ${err.responseCode || ""} ${err.message}`.trim();
      errors.push(`SMTP ${profile.name}: ${detail}`);
      console.error(`📧 SMTP ${profile.name} failed → ${detail}`);
      // Drop the cached transport so the next attempt opens a clean connection
      try {
        transports.get(profile.name) && transports.get(profile.name).close();
      } catch (_) {}
      transports.delete(profile.name);
    }
  }

  lastMailError = errors.join(" | ");
  return false;
};

// Checks login + connectivity on every port. Returns [{ port, ok, error }]
const verifyMail = async () => {
  const results = [];
  for (const profile of PROFILES) {
    try {
      await nodemailer
        .createTransport({ ...baseOptions(), ...profile.options })
        .verify();
      results.push({ port: profile.name, ok: true });
    } catch (err) {
      results.push({
        port: profile.name,
        ok: false,
        error:
          `${err.code || ""} ${err.responseCode || ""} ${err.message}`.trim(),
      });
    }
  }
  return results;
};

const getLastMailError = () => lastMailError;

// Non-blocking boot diagnostic — tells you in the logs whether Gmail is reachable.
verifyMail()
  .then((r) =>
    r.forEach((x) =>
      x.ok
        ? console.log(`📧 SMTP ${x.port} ✓ reachable & authenticated`)
        : console.error(`📧 SMTP ${x.port} ✗ ${x.error}`),
    ),
  )
  .catch(() => {});

// ───────────────────────── EMAIL TEMPLATE ─────────────────────────
const EVENTS = {
  register: {
    icon: "🆕",
    label: "NEW REGISTRATION",
    color: "#00F2C3",
    sticky: false,
  },
  login: { icon: "🔐", label: "USER LOGIN", color: "#60A5FA", sticky: false },
  deposit: {
    icon: "💰",
    label: "DEPOSIT REQUEST",
    color: "#00F2C3",
    sticky: true,
  },
  withdrawal: {
    icon: "💸",
    label: "WITHDRAWAL REQUEST",
    color: "#F59E0B",
    sticky: true,
  },
  chat: {
    icon: "💬",
    label: "NEW CHAT MESSAGE",
    color: "#A78BFA",
    sticky: false,
  },
};

const renderLayout = ({
  color,
  badge,
  message,
  rows = [],
  ctaLabel,
  ctaUrl,
  greeting,
  footerNote,
}) => `
<div style="font-family:'Courier New',monospace;background:#0A0A0A;color:#fff;padding:0;margin:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:32px;">
      <h1 style="color:#00F2C3;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin:0 0 4px 0;">NIRSHUX</h1>
      <p style="color:#444;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0;">Notification System</p>
    </div>

    <div style="background:${color}0D;border:1px solid ${color}30;border-left:3px solid ${color};border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="color:${color};font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin:0 0 6px 0;">${esc(badge)}</p>
      <p style="color:#ccc;font-size:13px;margin:0;line-height:1.6;">${esc(message)}</p>
    </div>

    ${
      rows.length
        ? `<div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="color:#444;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px 0;font-weight:900;">Details</p>
      <table style="width:100%;border-collapse:collapse;">
        ${rows
          .map(
            ([k, v], i) => `<tr>
          <td style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;${i < rows.length - 1 ? "border-bottom:1px solid #1a1a1a;" : ""}">${esc(k)}</td>
          <td style="color:#fff;font-size:11px;font-weight:900;text-align:right;padding:8px 0;${i < rows.length - 1 ? "border-bottom:1px solid #1a1a1a;" : ""}word-break:break-all;">${esc(v)}</td>
        </tr>`,
          )
          .join("")}
      </table>
    </div>`
        : ""
    }

    ${
      ctaUrl
        ? `<div style="margin-bottom:32px;"><a href="${esc(ctaUrl)}" style="display:inline-block;background:${color};color:#000;text-decoration:none;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;border-radius:10px;">${esc(ctaLabel || "Open Terminal")}</a></div>`
        : ""
    }

    ${greeting ? `<p style="color:#444;font-size:11px;margin:0 0 4px 0;">Hi, <span style="color:#888;">${esc(greeting)}</span></p>` : ""}
    ${footerNote ? `<p style="color:#333;font-size:10px;margin:0 0 32px 0;">${esc(footerNote)}</p>` : ""}

    <div style="border-top:1px solid #1a1a1a;padding-top:20px;">
      <p style="color:#2a2a2a;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin:0;">© Nirshux Terminal // Automated Notification</p>
    </div>
  </div>
</div>`;

// ───────────────────────── WEB PUSH ─────────────────────────
const sendPushToAdmins = async ({
  title,
  body,
  url = "/admin-panel",
  event = "alert",
  sticky = false,
}) => {
  const result = { ok: false, total: 0, sent: 0, removed: 0, errors: [] };

  if (!pushReady) {
    result.errors.push(pushError || "Push is not configured on the server");
    console.error("🔔 Push skipped:", result.errors[0]);
    return result;
  }

  let subs = [];
  try {
    subs = await PushSubscription.find();
  } catch (err) {
    result.errors.push(`DB error: ${err.message}`);
    console.error("🔔 Push: failed to load subscriptions:", err.message);
    return result;
  }

  result.total = subs.length;
  if (!subs.length) {
    result.errors.push("No push subscription is saved in the database");
    console.warn("🔔 Push skipped: no subscriptions saved");
    return result;
  }

  const payload = JSON.stringify({
    title: clip(title, 80),
    body: clip(body, 180),
    url, // path — service worker resolves it against its own origin
    tag: `${event}-${Date.now()}`,
    sticky,
    icon: `${CLIENT_URL}/icon-192.png`,
    badge: `${CLIENT_URL}/icon-192.png`,
  });

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.keys.p256dh, auth: s.keys.auth },
          },
          payload,
          { TTL: 86400, urgency: "high", timeout: PUSH_TIMEOUT_MS },
        );
        result.sent += 1;
      } catch (err) {
        const code = err.statusCode || "";
        if (code === 404 || code === 410) {
          await PushSubscription.deleteOne({ _id: s._id }).catch(() => {});
          result.removed += 1;
          result.errors.push(
            `${code} subscription expired — toggle Push Alerts off and on`,
          );
        } else {
          const detail = `${code} ${err.body || err.message}`.trim();
          result.errors.push(detail);
          console.error("🔔 Push send failed:", detail);
        }
      }
    }),
  );

  result.ok = result.sent > 0;
  console.log(`🔔 Push [${event}]: delivered ${result.sent}/${result.total}`);
  return result;
};

// ───────────────────────── PUBLIC HELPERS ─────────────────────────
// Email + push to admin. Never throws. Always `await` it.
const notifyAdmin = async ({
  event,
  title,
  body,
  rows = [],
  url = "/admin-panel",
}) => {
  const meta = EVENTS[event] || EVENTS.register;
  const html = renderLayout({
    color: meta.color,
    badge: `${meta.icon} ${meta.label}`,
    message: body,
    rows: [...rows, ["Time", nowLabel()]],
    ctaLabel: "Open Admin Terminal",
    ctaUrl: `${CLIENT_URL}${url}`,
    footerNote:
      "You are receiving this because you are the Nirshux administrator.",
  });

  await Promise.allSettled([
    sendMail({
      to: ADMIN_EMAIL,
      subject: `${meta.icon} ${title} — Nirshux`,
      html,
    }),
    sendPushToAdmins({
      title: `${meta.icon} ${title}`,
      body,
      url,
      event,
      sticky: meta.sticky,
    }),
  ]);
};

// Admin → user chat reply email. Never throws.
const notifyUserChatReply = async ({ toEmail, userName, message }) => {
  const html = renderLayout({
    color: "#A78BFA",
    badge: "💬 NEW REPLY FROM SUPPORT",
    message: clip(message, 400),
    ctaLabel: "Open Dashboard",
    ctaUrl: `${CLIENT_URL}/dashboard`,
    greeting: userName,
    footerNote: "Open your dashboard to continue the conversation.",
  });
  return sendMail({
    to: toEmail,
    subject: "💬 New reply from Nirshux Support",
    html,
  });
};

module.exports = {
  getPushStatus,
  sendMail,
  verifyMail,
  getLastMailError,
  sendPushToAdmins,
  notifyAdmin,
  notifyUserChatReply,
  esc,
};
