// Resolves this deployment's public base URL, needed because OG tags must
// be absolute URLs. Prefers Vercel's stable production domain over the
// ephemeral per-deployment URL it also provides, so shared links keep
// pointing at the same place across redeploys.
export function siteUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
