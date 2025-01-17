import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://trainnos.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      videos: [
        {
          title: "What to Expect at NOS",
          thumbnail_loc: "https://trainnos.com/public/WHATTOEXPECTTN.png",
          description:
            "Here is what you can expect as you walk through our door.",
        },
      ],
    },
    {
      url: "https://trainnos.com/pricing",
      lastModified: new Date(),
      changeFrequency: "monthly",
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
