# Suggestions (Phase 2+ ideas — logged, not built)

Ideas noticed during the crawl/rebuild. Nothing here gets built unless Nick names it.

- **Hero video re-encode:** current mp4 is H.264; an AV1/HEVC + H.264 fallback pair could halve the ~2.9 MB again with no visible loss.
- **Work index hover previews:** `/work` is a plain title list while the homepage has rich hover imagery — the index could reuse that hover-preview pattern for consistency.
- **Project page "next project" footer:** the "More work" CTA could become a full-bleed next-project teaser (common Awwwards pattern) to keep people moving through the portfolio.
- **YouTube facade:** replace live YouTube iframes with a click-to-load poster facade (lite-youtube pattern) — big LCP/JS win on the 7 project pages with embeds.
- **Unused font weights:** WebFont loader pulls Lato/Inter/Poppins/Questrial that the CSS barely/never uses — the rebuild can simply not load them (performance win, zero visual change; flagging since it's technically a deviation).
- **`/utility-pages/contact` URL:** odd Webflow path; a redirect from `/contact` would be friendlier if it's ever linked externally.
- **Author fields on blog posts** (name/job/description) are identical across posts — could become site-level singleton in Keystatic instead of per-post fields.
