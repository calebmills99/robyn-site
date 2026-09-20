/**
 * Crew story intake — validates multipart form and forwards to info@golden-wings-robyn.com
 * Mail provider: MailChannels when MAIL_FROM is set; otherwise returns 503.
 * TODO: connect Resend / Postmark / Cloudflare Email Routing once DNS is ready.
 */

const INFO_EMAIL = "info@golden-wings-robyn.com";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleCrew(request, env = {}) {
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

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: "Expected multipart form data" });
  }

  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const airline = String(form.get("airline") || "").trim();
  const years = String(form.get("years") || "").trim();
  const story = String(form.get("story") || "").trim();
  const consent = form.get("consent");
  const photo = form.get("photo");

  if (!consent || consent === "false" || consent === "off") {
    return json(400, {
      ok: false,
      error: "Consent is required before we can take your story.",
      field: "consent",
    });
  }

  if (!name || !email || !airline || !years || !story) {
    return json(400, {
      ok: false,
      error: "Name, email, airline, years flown, and your story are required.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: "Please enter a valid email.", field: "email" });
  }

  const mailFrom = env.MAIL_FROM || env.MAILCHANNELS_FROM;
  if (!mailFrom) {
    return json(503, {
      ok: false,
      error:
        "Mail provider is not configured (set MAIL_FROM for MailChannels). Your story was not stored.",
      missing: "MAIL_FROM",
    });
  }

  const text = [
    "New crew story from the Golden Wings site",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Airline: ${airline}`,
    `Years flown: ${years}`,
    "",
    "Story:",
    story,
    "",
    "Consent: yes — may contact and may use with credit.",
  ].join("\n");

  const content = [{ type: "text/plain", value: text }];
  const personalizations = [
    {
      to: [{ email: INFO_EMAIL, name: "Golden Wings" }],
      reply_to: { email, name },
    },
  ];

  const payload = {
    personalizations,
    from: { email: mailFrom, name: "Golden Wings Crew Door" },
    subject: `Crew story: ${name} (${airline})`,
    content,
  };

  if (photo && typeof photo === "object" && typeof photo.arrayBuffer === "function" && photo.size > 0) {
    const bytes = new Uint8Array(await photo.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    payload.attachments = [
      {
        filename: photo.name || "crew-photo.jpg",
        content: b64,
        type: photo.type || "application/octet-stream",
      },
    ];
  }

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
      error: "Mail provider request failed.",
      detail: String(err && err.message ? err.message : err),
    });
  }

  if (!mcRes.ok) {
    const detail = await mcRes.text().catch(() => "");
    return json(502, {
      ok: false,
      error: "Mail provider rejected the message. Nothing was stored on the server.",
      status: mcRes.status,
      detail: detail.slice(0, 500),
    });
  }

  return json(200, { ok: true });
}
