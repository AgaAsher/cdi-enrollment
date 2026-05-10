import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://isl-cda.com";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/teacher", "/api"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
