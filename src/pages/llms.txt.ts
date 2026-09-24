// /llms.txt — a plain-text brief on Nick for AI agents (the llmstxt.org convention). A
// recruiter's research assistant can read this in one request instead of parsing a
// design-heavy page: who he is, what he's done, the work, and how to reach him.
// Built from the same About data and Projects collection the site renders, so it never
// drifts from the pages.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import about from '../data/about.json';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const projects = (await getCollection('projects'))
    .filter((p) => !p.data.password)
    .sort((a, b) => a.data.order - b.data.order);

  const work = projects
    .map((p) => {
      const d = p.data;
      const meta = [d.category, d.client, d.role, d.year].filter(Boolean).join(' · ');
      return `- [${d.title}](${url(`/projects/${p.id}`)}): ${meta}${d.summary ? ` — ${d.summary}` : ''}`;
    })
    .join('\n');

  const experience = about.experience
    .map((j) => `- ${j.year}: ${j.title}, ${j.company}. ${j.description}`)
    .join('\n');

  const body = `# Nick Kidd — Creative Director

> Nick Kidd is a creative director based in Dallas–Fort Worth, Texas, with 12+ years leading award-winning integrated campaigns, brands, and digital experiences for global technology and consumer brands — Qualcomm (Snapdragon, Dragonfly), Audi, Samsung, T-Mobile, and Fluence Energy among them. He works directly with CEOs and agency leadership on creative strategy, and builds the teams, workflows, and AI-enabled systems that make great work repeatable.

## At a glance

- Role: Creative director. Currently Associate Creative Director at Transmission Agency, working at creative-director level with full creative ownership of key global tech accounts.
- Location: Dallas–Fort Worth, Texas, USA. Open to remote.
- Strengths: creative vision and campaign leadership, brand strategy and storytelling, client relationships, creative operations and org design, AI-enabled creative workflows, video production, art direction, UX and web.
- Results: on current accounts, lifted recommendations 29.4%, brand preference 60%, and branded attention 158% over average.
- Clients: Qualcomm, Audi, Samsung, T-Mobile, Fluence Energy, AMD, HP, HPE, W.K. Kellogg Foundation, Pizza Hut, F5, Pepsi, Software AG, Nutanix, Poly, Citrix.
- Awards: Silver ADDY, Bronze at The Drum Awards, Gold B2 Award, Gold Reggie, and Silver Telly (2026); Gold MarCom (2024); 32 Under 32 (2019); Gold National ADDY (2018).
- Education: BA in Advertising, Texas Tech University.

## Contact

- Email: contact@nickkidd.net
- LinkedIn: https://www.linkedin.com/in/nickkidd/
- Resume (PDF): ${url('/assets/nick-kidd-resume.pdf')}

## Experience

${experience}

## Work

${work}

## Pages

- [Home](${url('/')}): overview, showreel, and featured work
- [Work](${url('/work')}): every project
- [About](${url('/about')}): background, experience, beliefs, testimonials, clients, awards
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
