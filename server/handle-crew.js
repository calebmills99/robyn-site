/**
 * Crew story intake - validates multipart form and emails it to the owner.
 * Mail provider: Cloudflare Email Routing via the FORMS_MAIL send_email binding
 * (see server/send-mail.js). Nothing is stored on the server.
 */
import { sendFormMail } from "./send-mail.js";

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

  const text = [
    "New crew story from golden-wings-robyn.com",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Airline and years: ${airlineYears}`,
    "",
    "Story:",
    story,
    "",
    "Consent: yes, they agreed to be contacted and to have their story used with credit.",
    "",
    "Photo: not attached on first submit. Reply to this email to ask them for photos if useful.",
    "",
    "Sent by the Gwingz Studios site forms.",
  ].join("\n");

  const result = await sendFormMail(env, {
    fromName: "Golden Wings Crew Door",
    subject: `Crew story: ${name} (${airlineYears})`,
    text,
    replyTo: email,
    replyToName: name,
  });

  if (!result.ok) {
    return json(502, {
      ok: false,
      error:
        "We could not send your story right now. Please try again in a few minutes or email info@golden-wings-robyn.com.",
      code: result.error,
    });
  }

  return json(200, { ok: true });
}
