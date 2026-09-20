import { handleSms } from "../../server/handle-sms.js";

/** Cloudflare Pages Function — POST /api/sms */
export async function onRequestPost(context) {
  return handleSms(context.request, context.env);
}

export async function onRequestOptions(context) {
  return handleSms(context.request, context.env);
}
