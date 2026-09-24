// Every public page, for search engines. Built at deploy time from the Projects collection,
// so a case study added in Keystatic shows up on the next build. Leaves out the experiments,
// the (retired) blog, and any password-gated project.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const projects = (await getCollection('projects'))
    .filter((p) => !p.data.password)
    .sort((a, b) => a.data.order - b.data.order);

  const pages = [
    { path: '/', priority: '1.0' },
    { path: '/work/', priority: '0.9' },
    { path: '/about/', priority: '0.9' },
    ...projects.map((p) => ({ path: `/projects/${p.id}`, priority: '0.8' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${new URL(p.path, site).href}</loc><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
