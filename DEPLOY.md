# Deploying nickkidd.net — Cloudflare Pages + Keystatic GitHub mode

The site is static-first Astro 5 with the Cloudflare adapter; only Keystatic's
`/keystatic` admin + API routes render on demand. One deploy serves both the site
and the CMS. No secrets live in the repo — Keystatic's GitHub App credentials are
Cloudflare environment variables only.

## 1. Push the repo to GitHub

```bash
git remote add origin https://github.com/<you>/nickkidd-net.git
git push -u origin main
```

Private repo is fine — Keystatic works against private repos.

## 2. Create the Cloudflare Pages project

Cloudflare dashboard → Workers & Pages → Create → Pages → connect the GitHub repo.

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Add a `wrangler.toml`/dashboard binding note: if the build warns about an
  `Invalid binding SESSION`, add a KV namespace binding named `SESSION`
  (Workers → KV → create namespace → bind it in Pages → Settings → Bindings).

Every push to `main` rebuilds and deploys. Keystatic edits ARE pushes, so content
changes rebuild the site automatically.

## 3. Switch Keystatic to GitHub mode

1. Deploy once in local mode first so the Pages URL exists.
2. In `keystatic.config.ts` change:
   ```ts
   storage: { kind: 'github', repo: '<you>/nickkidd-net' },
   ```
3. Visit `https://<your-pages-url>/keystatic` once — Keystatic walks you through
   creating its GitHub App (this generates the credentials). Install the app on
   the repo when prompted.
4. Put the generated values in Cloudflare Pages → Settings → Environment variables
   (Production + Preview):
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
   - `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
5. **Redeploy after setting the variables.** `PUBLIC_*` vars are inlined at build
   time on Cloudflare Pages — a fresh build is required before they take effect.

After that: `https://www.nickkidd.net/keystatic` → "Log in with GitHub" → edits
commit straight to `main` → auto-rebuild. Nothing else to run or host.

## 4. Point the Dynadot domain

Recommended: move DNS to Cloudflare (free) for the cleanest setup.

1. Cloudflare → Add site → `nickkidd.net` (Free plan). Cloudflare shows two
   nameservers (e.g. `ada.ns.cloudflare.com` / `bob.ns.cloudflare.com`).
2. Dynadot → My Domains → nickkidd.net → DNS/Nameservers → set those two
   nameservers. Propagation: minutes to a few hours.
3. Cloudflare Pages project → Custom domains → add `www.nickkidd.net` and
   `nickkidd.net` (Cloudflare creates the records and certificates itself).

Alternative without moving DNS: at Dynadot create a CNAME `www` →
`<project>.pages.dev` and use Dynadot's domain forwarding for apex → www.
(Works, but certificates and apex handling are smoother on Cloudflare DNS.)

## 5. Post-deploy checklist

- `/keystatic` loads and edits a project + a blog post end-to-end (checkpoint 8).
- View-source on the deployed home page: zero `website-files.com` references.
- Adobe Fonts kit loads on the production domain (the kit allows nickkidd.net;
  if Typekit 403s, add the domain in the Adobe Fonts web project settings).
- gtag/Clarity/Apollo fire (check the Network tab).
