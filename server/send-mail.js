/**
 * Form mail via Cloudflare Email Routing (Workers send_email binding).
 * Binding: env.FORMS_MAIL (see wrangler.toml [[send_email]]).
 * Sender must be on a zone with Email Routing enabled (gwingz.com);
 * destination must be a verified Email Routing destination address.
 */
import { EmailMessage } from "cloudflare:email";

export const MAIL_FROM = "forms@gwingz.com";
export const MAIL_TO = "caleb.mills.stewart@gmail.com";

function oneLine(v) {
  return String(v || "").replace(/[\r\n]+/g, " ").trim();
}

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function encodeWord(str) {
  const s = oneLine(str);
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64utf8(s)}?=`;
}

function mailbox(name, addr) {
  const n = oneLine(name).replace(/["\\]/g, "");
  return n ? `"${encodeWord(n)}" <${oneLine(addr)}>` : `<${oneLine(addr)}>`;
}

export function isEmail(v) {
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(String(v || ""));
}

/**
 * Send a plain-text email to the owner.
 * @returns {{ok: true, messageId: string} | {ok: false, error: string, detail?: string}}
 */
export async function sendFormMail(env, { fromName, subject, text, replyTo, replyToName }) {
  const binding = env && env.FORMS_MAIL;
  if (!binding || typeof binding.send !== "function") {
    return { ok: false, error: "mail_binding_missing", detail: "FORMS_MAIL send_email binding is not configured." };
  }

  const messageId = `<${crypto.randomUUID()}@gwingz.com>`;
  const body = b64utf8(String(text || "")).replace(/.{1,76}/g, "$&\r\n");
  const headers = [
    `From: ${mailbox(fromName || "Golden Wings Forms", MAIL_FROM)}`,
    `To: ${mailbox("Caleb", MAIL_TO)}`,
    `Subject: ${encodeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "X-Golden-Wings-Form: golden-wings-robyn.com",
  ];
  if (replyTo && isEmail(replyTo)) headers.push(`Reply-To: ${mailbox(replyToName, replyTo)}`);

  const raw = headers.join("\r\n") + "\r\n\r\n" + body;

  try {
    await binding.send(new EmailMessage(MAIL_FROM, MAIL_TO, raw));
    console.log(JSON.stringify({ event: "form_mail_sent", subject: oneLine(subject), messageId }));
    return { ok: true, messageId };
  } catch (err) {
    const detail = String(err && err.message ? err.message : err).slice(0, 300);
    console.error(JSON.stringify({ event: "form_mail_failed", subject: oneLine(subject), detail }));
    return { ok: false, error: "mail_send_failed", detail };
  }
}
