import { handleCrew } from "../../server/handle-crew.js";

/** Cloudflare Pages Function — POST /api/crew */
export async function onRequestPost(context) {
  return handleCrew(context.request, context.env);
}

export async function onRequestOptions(context) {
  return handleCrew(context.request, context.env);
}
