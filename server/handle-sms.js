/**
 * SMS opt-in intake — validates phone and forwards to info@golden-wings-robyn.com
 * No Twilio (or other SMS provider) is wired yet.
 * TODO: connect Twilio / Cloudflare SMS / similar; until then we email the number.
 */

const INFO_EMAIL = "info@golden-wings-robyn.com";

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

  // TODO: Twilio Messaging Service (or equivalent) — no SMS provider in this repo yet.
  const mailFrom = env.MAIL_FROM || env.MAILCHANNELS_FROM;
  if (!mailFrom) {
    return json(503, {
      ok: false,
      error:
        "SMS provider is not configured, and MAIL_FROM is missing so we cannot forward the number by email either.",
      missing: ["twilio", "MAIL_FROM"],
    });
  }

  const payload = {
    personalizations: [{ to: [{ email: INFO_EMAIL, name: "Golden Wings" }] }],
    from: { email: mailFrom, name: "Golden Wings Screenings" },
    subject: `SMS opt-in: ${phone}`,
    content: [
      {
        type: "text/plain",
        value: [
          "New SMS screening opt-in from the Golden Wings site.",
          "",
          `Phone: ${phone}`,
          "",
          "TODO: connect Twilio (or another SMS provider). Until then this is email-only intake.",
          "Nothing else was stored.",
        ].join("\n"),
      },
    ],
  };

  const mcHeaders = { "content-type": "application/json" };
  if (env.MAILCHANNELS_API_KEY) {
    mcHeaders["X-Api-Key"] = env.MAILCHANNELS_API_KEY;
  }

  let mcRes;
  try {
    mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: mcHeaders,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json(502, {
      ok: false,
      error: "Mail forward for SMS opt-in failed.",
      detail: String(err && err.message ? err.message : err),
    });
  }

  if (!mcRes.ok) {
    const detail = await mcRes.text().catch(() => "");
    return json(502, {
      ok: false,
      error: "Could not forward the opt-in. Nothing was stored.",
      status: mcRes.status,
      detail: detail.slice(0, 500),
    });
  }

  return json(200, { ok: true, via: "email-forward", smsProvider: null });
}
