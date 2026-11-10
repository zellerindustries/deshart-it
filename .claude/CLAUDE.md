# Desh portfolio

Static Italian portfolio site (`lang="it"`, package `portfolio-desh`) built with `@minimaz/sitekit`. `src/` is authored, `dist/` is generated.

## Commands

```bash
npm run build          # mz b --overwrite
npm start              # build, then serve dist/
npm run format         # prettier --write .
npm run format:check   # also the Husky pre-commit hook
npm run lint           # htmlhint + stylelint + cspell; also lint:a11y, lint:links (build first)
```

No tests. The pre-commit hook runs `format:check` and the three lints; add legitimate names to `cspell.json` `words` rather than editing copy. Verify visually with `npm start` in a browser. Node is pinned to `26.13.0` in `.nvmrc`; `engines` is `>=26` with `engine-strict=true`.

## Structure

- `src/pages/`: `index`, `form`, `portfolio`, `linkinbio` (own `linkinbio.css`), `error/` (own `error.css` + `script.ts`). Pages are standalone HTML with duplicated header/footer, so shared chrome changes go in every page.
- `src/style.css` is the bundle entry; `src/styles/*.css` is one concern per file. `src/script.ts` imports one module per feature from `src/scripts/` (`header`, `flip-cards`, `scroll-animations`, `back-button`, `form`).
- `minimaz.config.json` maps `scripts` to `dist/scripts/` and everything else to the root. The `<!--security-->` placeholder in pages is replaced at build time with the shared CSP `<meta>` from `output.replace`: edit the CSP there, not in the HTML.
- Fonts (Besley, Figtree) are self-hosted woff2 in `src/public/fonts/`. bootstrap-icons fonts are remapped from `node_modules` via `externals`.
- `src/public/` also holds `robots.txt` (blocks AI crawlers, allows Googlebot/Bingbot), `sitemap.xml` (4 URLs) and `.well-known/security.txt`. Add new pages to the sitemap.

## Contact form

`form.html` + `scripts/form.ts`: honeypot field `bot-field`, 3 s minimum fill time, 5-minute `localStorage` resubmission lock, then POST to an AWS Lambda URL (eu-south-1). That origin is whitelisted in the CSP `connect-src`; changing the endpoint means updating the CSP too. No backend code lives here.

## Structured data

JSON-LD is present on `index`, `form`, `linkinbio` and `portfolio`. Keep it in sync when page content changes.

## Deploy

Push to `main` builds and rsyncs `dist/` to production over SSH (`.github/workflows/deploy.yml`), no staging, no approval. Work happens on `develop`. CI reads the Node version from `.nvmrc`.

## Scope

@SCOPE.md
