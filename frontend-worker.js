/**
 * Frontend Worker - static assets + Phase 3 redirects + crew/SMS API.
 */
import redirects from "./redirects.json";
import { handleCrew } from "./server/handle-crew.js";
import { handleSms } from "./server/handle-sms.js";

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function resolveTarget(requestUrl, target) {
  if (/^https?:\/\//i.test(target)) return target;
  const u = new URL(requestUrl);
  u.pathname = target;
  u.search = new URL(requestUrl).search;
  return u.toString();
}

function withFontCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (path === "/api/crew") {
      return handleCrew(request, env);
    }
    if (path === "/api/sms") {
      return handleSms(request, env);
    }

    // Parity Studio is local-dev only (Vite middleware). Never serve it from Workers.
    if (
      path === "/__parity" ||
      path.startsWith("/__parity/") ||
      path === "/parity-studio" ||
      path.startsWith("/parity-studio/")
    ) {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method === "OPTIONS" && path.startsWith("/fonts/")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const rule = redirects[path];
    if (rule) {
      const location = resolveTarget(request.url, rule.target);
      return Response.redirect(location, rule.status || 301);
    }

    const asset = await env.ASSETS.fetch(request);
    if (path.startsWith("/fonts/")) {
      return withFontCors(asset);
    }
    return asset;
  },
};
