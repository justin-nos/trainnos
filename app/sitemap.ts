import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://trainnos.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://trainnos.com/meet",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://trainnos.com/testimonials",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
