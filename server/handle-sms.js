/**
 * SMS opt-in intake - validates phone and emails it to the owner.
 * No Twilio (or other SMS provider) is wired yet, so intake is email-only
 * via the FORMS_MAIL send_email binding (see server/send-mail.js).
 */
import { sendFormMail } from "./send-mail.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleSms(request, env = {}) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let phone = "";
  const ctype = request.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/json")) {
      const body = await request.json();
      phone = String(body.phone || "").trim();
    } else {
      const form = await request.formData();
      phone = String(form.get("phone") || "").trim();
    }
  } catch {
    return json(400, { ok: false, error: "Could not read phone number" });
  }

  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 10) {
    return json(400, {
      ok: false,
      error: "Enter a valid phone number.",
      field: "phone",
    });
  }

  const text = [
    "New SMS screening-list opt-in from golden-wings-robyn.com",
    "",
    `Phone: ${phone}`,
    "",
    "No SMS provider is connected yet, so this email is the only record. Nothing else was stored.",
    "",
    "Sent by the Gwingz Studios site forms.",
  ].join("\n");

  const result = await sendFormMail(env, {
    fromName: "Golden Wings Screenings",
    subject: `SMS opt-in: ${phone}`,
    text,
  });

  if (!result.ok) {
    return json(502, {
      ok: false,
      error:
        "We could not save your number right now. Please try again in a few minutes or email info@golden-wings-robyn.com.",
      code: result.error,
    });
  }

  return json(200, { ok: true, via: "email-forward", smsProvider: null });
}
