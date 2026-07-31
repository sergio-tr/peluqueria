# Portfolio Netlify evidence (Phase 3A)

**Date:** 2026-07-31  
**Purpose:** Document the sibling workspace project used as the non-secret Netlify deployment pattern reference for Peluquería Nowi.

## Workspace scan

Script: `.cursor/scripts/find-portfolio-netlify.mjs`  
Root: `c:\Users\Sergio\workspaces` (excluding `peluqueria`)

| Candidate | Remote | Netlify signals | Selected |
|-----------|--------|-----------------|----------|
| `portfolio-json` | `https://github.com/sergio-tr/portfolio-json.git` | README links to `https://sergiotr.netlify.app` and `https://sergiotr-minimalist.netlify.app`; package `minimalist-portfolio-json`; Astro static build to `./dist/` | **Yes** |
| `portfolio` | `https://github.com/sergio-tr/portfolio.git` | Same author; Astro + Tailwind; no committed `netlify.toml` | Secondary |
| `sergio-tr` | profile README only | States portfolio “deployed at Netlify” | Corroborating |

No sibling repository in the workspace contains a committed `netlify.toml` or `.netlify/state.json`. Deployment is Git-connected Netlify with default Astro static settings.

## Reused pattern (non-secret)

| Aspect | Portfolio (Astro) | Peluquería Nowi (Next.js) |
|--------|-------------------|---------------------------|
| Hosting | Netlify account (existing) | Same account; **new site** for this app |
| Connect | GitHub repo → Netlify UI | GitHub repo → Netlify UI |
| Build | `npm run build` → `./dist/` | `npm run build` + `@netlify/plugin-nextjs` |
| Preview | Netlify deploy previews / branch deploys | `netlify deploy` (draft) or PR deploy preview |
| Production | `sergiotr.netlify.app` (portfolio domain) | **Phase 8 only** — not configured in 3A |
| HTTPS | Netlify-managed TLS on `*.netlify.app` | Same |
| CLI login | `netlify login` | Same |

## Explicitly not copied

- Site IDs, auth tokens, `.netlify/state.json`
- Environment variable values
- Portfolio domains or webhook URLs

## Adaptation notes

Next.js App Router requires `@netlify/plugin-nextjs` (ADR-001). Scheduled functions live under `netlify/functions/` (hourly expiration from Phase 2C). Preview protection uses the demo gate (`DEMO_ACCESS_CODE`), not Netlify password protection.
