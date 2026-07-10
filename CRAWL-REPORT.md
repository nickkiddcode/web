# nickkidd.net — Crawl Report (Step 0)

Crawled 2026-07-09 into `_source/`. Pages in `_source/*.html` (paths mirror URLs), all CDN assets in `_source/cdn/`, raw data in `_source/crawl-report.json`.

## Pages (24)

| Page | Notes |
|---|---|
| `/` | Long interactive one-pager: hero (NICK/KIDD + bg video), quote, Recent Projects grid (16), project hover list, "about me" bento (Ideas Are My Superpower, Creative Operations kanban, Some Tools I Love marquee, Marketing Maestro, Design Backed by Science — Fitts' Law/Cognitive Load cards, Strong Foundations, Research and Strategy, Midnight Oil Connoisseur), Kidd Effect, mosaic grid, kerning button, blog teaser ("No kiddin'", 4 posts), "Made it this far?" footer, "THAT'S JUST A TASTE" |
| `/work` | Project index — 16 titles |
| `/about` | Who-description, "Hey, I'm Nick.", Experience timeline (4 roles), 4 beliefs, 6 testimonials, select clients, Awards list |
| `/projects/<slug>` ×16 | CMS collection |
| `/blog-posts/<slug>` ×4 | CMS collection |
| `/utility-pages/contact` | "Made it this far?" + "unlock your potential" + bg video |

**Note:** the kanban / Kidd Effect / behavioral-science cards / KERNING / mosaic modules live on the **homepage**, not `/about` (verified in crawled HTML). `/about` is a separate simpler page (experience, beliefs, testimonials, clients, awards). Rebuilding faithfully as found.

## Projects (16) — field inventory

Fields observed per entry: `title`, `shortDescription` (intro paragraph), `client` (optional), `role` (optional), `category`, `year` (string — e.g. "2015-2020"), `image1` (hero) … `image9` (gallery; empty slots common), `video1` (background-video slot — **currently empty on every project**), rich body sections `Overview` / `Approach` / `Outcome` (multi-paragraph), optional YouTube embeds (direct iframe or Embedly wrapper).

| Slug | Title | Client / Role / Category / Year | Imgs | YouTube |
|---|---|---|---|---|
| dragonfly-brand-launch | Dragonfly Brand Launch | Qualcomm Dragonfly / Creative Drector [sic] / Video Production / 2026 | 4 | yes |
| snapdragon | Let's Give 55% | Qualcomm / ACD / Creative Direction | 5 | 3 vids |
| sugar-lane | Sugar Lane | Sugar Lane / Creative Director / Branding / 2026 | 6 | — |
| great-minds-poc | Great Minds | Snapdragon / ACD / AI / 2025 | 3 | yes |
| audi-illustrations | Audi Illustrations | — / — / Illustration / 2018 | 6 | — |
| vistajet | VistaJet | — / — / Web Design / 2024 | 6 | — |
| crowns-of-resemblance | Crowns of Resemblance | — / — / Book Cover / 2024 | 3 | — |
| pathfinder-studios | Pathfinder Studios | Pathfinder Studios / Design Director / Branding / 2024 | 2 | yes |
| encanto | Encanto | Me / Owner / Entrepreneurship / 2019 | 9 | — |
| don-julio | Don Julio | Don Julio / Art Director / Illustration / 2019 | 1 | — |
| 4r | 4R Fences and Patios | 4R / Creative Director / Branding / 2024 | 6 | yes |
| pwc | Playwrights' Center | — / — / UX / 2024 | 4 | yes |
| ndorh | National Day of Racial Healing | — / — / UX / 2023 | 4 | — |
| roomvy | Roomvy | — / — / UX / 2024 | 9 | yes |
| audi-dealership | Audi Dealership | — / — / Shopper Marketing / 2015-2020 | 5 | 3 vids |
| masonmagnolia | Mason & Magnolia | — / — / Branding / 2021 | 6 | — |

Hero rule per spec: `video1` present → video hero; else `image1`. No entry currently has `video1` — the field will exist in Keystatic ready for use.

## Blog posts (4) — field inventory

Fields: `title`, `date`, `category`, `mainImage`, rich body (h2-level sections, paragraphs, blockquotes), 2 extra image slots (all empty), author block (image, name "Nick Kidd", job "Design Director", description "Artist, Story teller, Ops Innovator").

| Slug | Title | Date | Category |
|---|---|---|---|
| stop-juggling-social-media-with-your-business | Stop Juggling Social Media with Your Business | Oct 9, 2024 | Social Media |
| dont-ask-for-a-logo-ask-this-instead | Don't Ask For a Logo. Ask This Instead. | Oct 4, 2024 | Branding |
| how-i-get-to-know-my-designers | How I Get To Know My Designers | Sep 26, 2024 | Design |
| how-to-train-creativity | How to Train Creativity | Sep 26, 2024 | Career Growth |

## Assets

- **637 unique files, ~200 MB** local in `_source/cdn/` — includes all responsive srcset variants, og:image cards, favicons.
- **Videos:** hero "Shapes Monochromatic" (2.9 MB mp4 + 1.8 MB webm + poster) on Home; second bg video (0.8 MB mp4 + 2.1 MB webm + poster) on the Contact utility page. Both already Webflow-compressed; will re-encode/trim further at build.
- Only unretrievable file: Webflow's editor `placeholder.svg` (403, used only for empty CMS binds — not needed).
- Largest images: several 2–3.8 MB PNGs/JPGs — will go through Astro's image pipeline.

## Fonts

- **Adobe Fonts (Typekit kit `rrl8joh`):** actually used in CSS → `loos-extended` (22 rules) and `loos-extrawide` (8) — the display faces. Kit also contains Area + Owners families (unused in CSS).
- **Google (WebFont loader):** `Work Sans` (22 rules — body/UI). Lato + Poppins each appear once (likely vestigial); Inter/Questrial loaded but unused.
- **Self-hosted:** `Zalando Sans Expanded` variable TTF (downloaded, 124 KB) — 13 rules.

## Third-party on current site

- Spline embed on Home: `https://prod.spline.design/gPRWbBQLmX9stmVH/scene.splinecode` (carry over lazy-loaded per spec)
- FREE INSIGHTS nav → `https://brand-storyteller-ai-38203086.base44.app` (external link, keep)
- YouTube embeds on 7 project pages (some via Embedly wrapper)
- Analytics/tracking currently installed by Webflow setup: Google Tag Manager, Microsoft Clarity, Apollo.io tracker — **question for Nick below**
- jQuery + webflow.js (replaced by GSAP/Lenis rebuild, not carried over)

## Questions for Nick (checkpoint 1)

1. **Fonts — route A or B?** A: keep Adobe kit embed (`use.typekit.net/rrl8joh.js`, requires active Adobe account, loads only from Adobe CDN). B: self-host free equivalents. Closest free matches for the Loos widths: **Archivo Expanded / Archivo SemiExpanded** (Google, variable width axis) or **Clash Display** (Fontshare) for the extended display voice; Work Sans is already free on Google. Zalando Sans Expanded is already self-hostable (open font, OFL).
2. **Analytics:** GTM + Clarity + Apollo exist on the current site. Carry them over, or drop (guardrails say no analytics unless asked)?
3. **Typo found:** Dragonfly page says "Creative Drector". Preserve verbatim per rule 2, or fix?
4. **Embedly wrappers** on some YouTube embeds: rebuild as plain privacy-friendly YouTube iframes (same videos, same placement), or keep Embedly?
