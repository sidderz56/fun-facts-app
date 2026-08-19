import type { MetadataRoute } from "next";

// spec 5.7: the admin dashboard must be "excluded from robots.txt and any
// sitemap" — this app has no sitemap (nothing else in the spec calls for
// one), so this file is the whole of that requirement.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin", "/api/admin", "/api/cron", "/api/internal"],
    },
  };
}
