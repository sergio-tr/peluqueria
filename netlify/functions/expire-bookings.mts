/**
 * Netlify Scheduled Function — hourly expiration.
 * Configure in Netlify UI: schedule `0 * * * *`
 * Env: CRON_SECRET, NEXT_PUBLIC_SITE_URL
 */
const expireBookings = async () => {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response("missing env", { status: 500 });
  }
  const res = await fetch(`${base}/api/cron/expire`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(await res.text(), { status: res.status });
};

export default expireBookings;

export const config = {
  schedule: "@hourly",
};
