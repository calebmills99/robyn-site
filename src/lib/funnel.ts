/**
 * The screening funnel lives on gwingz.com. This site sends people there to
 * leave an email and watch the first cut. `placement` lands in utm_content so
 * GA4 shows which button did the work.
 */
export const FUNNEL_ORIGIN = "https://gwingz.com";

export function watchUrl(placement: string): string {
  const q = new URLSearchParams({
    utm_source: "golden-wings-robyn.com",
    utm_medium: "site",
    utm_campaign: "first-cut",
    utm_content: placement,
  });
  return `${FUNNEL_ORIGIN}/?${q.toString()}`;
}
