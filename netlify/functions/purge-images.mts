/**
 * Netlify Scheduled Function — daily image retention purge (ADR-012 / C-07).
 * Configure in Netlify UI: schedule `0 3 * * *`
 * Env: CRON_SECRET, NEXT_PUBLIC_SITE_URL, PURGE_ENABLED (default true)
 */
const purgeImages = async () => {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response("missing env", { status: 500 });
  }
  const res = await fetch(`${base}/api/cron/purge`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(await res.text(), { status: res.status });
};

export default purgeImages;

export const config = {
  schedule: "@daily",
};
