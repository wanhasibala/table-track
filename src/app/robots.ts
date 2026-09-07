import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nata.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/order/", "/auth/login", "/auth/register"],
        disallow: [
          "/d/",
          "/cashier/",
          "/kitchen/",
          "/api/",
          "/onboarding/",
          "/kiosk/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
