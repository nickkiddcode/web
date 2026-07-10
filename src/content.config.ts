import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Mirrors the Webflow CMS field set discovered in the crawl (CRAWL-REPORT.md).
// image1 = hero image; video1 (optional) wins the hero slot when present.
const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      client: z.string().default(''),
      role: z.string().default(''),
      category: z.string().default(''),
      year: z.string().default(''),
      summary: z.string().default(''),
      image1: image().nullable(),
      video1: z.string().nullable(),
      heroEmbed: z.string().nullable(),
      videoEmbeds: z.array(z.string()).default([]),
      image2: image().nullable(),
      image3: image().nullable(),
      image4: image().nullable(),
      image5: image().nullable(),
      image6: image().nullable(),
      image7: image().nullable(),
      image8: image().nullable(),
      image9: image().nullable(),
      image10: image().nullable(),
      overview: z.string().default(''),
      approach: z.string().default(''),
      outcome: z.string().default(''),
    }),
});

// Blog posts: .mdoc body rendered via @astrojs/markdoc; field set mirrors the
// Webflow CMS (date/category/mainImage + optional video and lightbox slots).
const blog = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.string().default(''),
      mainImage: image().nullable(),
      mainVideo: z.string().nullable().default(null),
      image1: image().nullable().default(null),
      image2: image().nullable().default(null),
    }),
});

export const collections = { projects, blog };
