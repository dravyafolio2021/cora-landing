# Cora landing page

Landing page for Cora, the AI co-founder for agencies.

- `index.src.html` is the page (template slots: `<!--FONTS-->`, `<!--TILES-->`, `<!--LOGOS-->`, `<!--STRIP-->`, `__SITE__`).
- `npm run build` writes the static site to `dist/`: self-hosted fonts (@fontsource), official brand marks (simple-icons), `og-image.png` (satori + resvg), `robots.txt` and `sitemap.xml`.
- Vercel builds every push. Branches and pull requests get preview URLs; `main` is production.
- Set `SITE_URL` in Vercel once a custom domain is live, so canonical and share-image URLs use it.
