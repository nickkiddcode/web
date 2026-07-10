# Blog redesign proposal — Phase 2, first target

Draft for Nick's review before any build (execution step 9). Everything below uses the
Phase 1 design system: Loos Extended/Extrawide display, Work Sans body, Zalando Sans
Expanded accents, `--purple #6100b9`, ink `#1c1c1d`, page `#eff1f3`, the established
spacing rhythm, and the same fade-in/rise motion language.

## Concept: "No kiddin'" as an editorial masthead

The blog already has a name — the homepage teaser calls it **No kiddin'**. The redesign
treats it as a small editorial publication inside the portfolio rather than a template
"blog": typographic, confident, mostly black-on-offwhite, purple used only as punctuation.

## 1. Blog index — `/blog` (new page; teaser links and nav stay as they are)

- **Masthead:** oversized "No kiddin'" in Loos Extrawide (same scale voice as NICK/KIDD),
  with a one-line dek in Work Sans: writing on creativity, leadership, and craft.
- **Latest post = lead story:** full-width row — main image left (16:9, Astro-optimized),
  category + date eyebrow, display-size title, first ~30 words as excerpt, underlined
  "Read" arrow (reuses the View Project arrow language).
- **The rest = editorial index rows,** matching the Work page's typographic list feel:
  date column (mono-spaced feel via Work Sans caps), title in Loos Extended, category
  as the right-aligned slash item. Row hover: title slides 8px, thumbnail fades in on
  the right edge (desktop only, pointer:fine only).
- Categories double as filters (client-side, no dependency — a few lines of JS).

## 2. Post template — `/blog-posts/<slug>` (replaces the broken layout)

- **Title block:** centered, Loos Extended at display scale, category/date eyebrow above
  in letterspaced caps; thin rule below (same `.div-block` rule the site already uses).
- **Lead image:** contained (max ~1100px), soft-radius none — flat, flush, gallery-like.
- **Body at a real reading measure:** ~68ch Work Sans 20-22px/1.6, generous block spacing;
  H2/H3 in Loos Extended with tightened line-height; lists with purple markers;
  **blockquotes as pull-quotes** — larger, indented, purple left rule (his voice deserves
  the stage: "You can't polish nothing…").
- **Author block:** slimmed row — photo, name, job — pinned after the body with a rule
  above; pulls from the Keystatic author singleton.
- **Next/previous post footer:** two typographic cards (no images), consistent with the
  "More work" CTA on project pages.
- Motion: one fade-in/rise on the title block, content reveals as-you-read (existing
  IntersectionObserver pattern), all `prefers-reduced-motion` aware.

## Explicitly not doing

Reading-time badges, share buttons, comments, newsletter capture, sticky TOCs, or any
third-party embeds — restraint, per the design principles and anti-scope-creep rules.

## Notes

- Post images route through Astro's pipeline (already wired via the collection schema).
- The homepage "No kiddin'" teaser stays visually unchanged; it just keeps reading from
  the same collection.
- If a `/blog` nav link is wanted later, that's a one-line change — not assumed here.
