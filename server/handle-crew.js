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
  const airlineYears = String(
    form.get("airline_years") || form.get("airline") || ""
  ).trim();
  const story = String(form.get("story") || "").trim();
  const consent = form.get("consent");

  if (!consent || consent === "false" || consent === "off") {
    return json(400, {
      ok: false,
      error: "Consent is required before we can take your story.",
      field: "consent",
    });
  }

  if (!name || !email || !airlineYears || !story) {
    return json(400, {
      ok: false,
      error: "Name, email, airline & years, and your story are required.",
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
    `Airline & years: ${airlineYears}`,
    "",
    "Story:",
    story,
    "",
    "Consent: yes — may contact and may use with credit.",
    "",
    "Photo: not attached on first submit. Ask them to email photos to info@golden-wings-robyn.com if useful.",
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
    subject: `Crew story: ${name} (${airlineYears})`,
    content,
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
