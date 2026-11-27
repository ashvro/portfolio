# Portfolio

A React + Vite landing page. A portrait turns to face you as you scroll, then hands off through seven sections with a slide-up and blur effect.

## Run it

Node 22 is recommended (Vite 8).

```bash
npm install
npm run dev
```

Open the address it prints (usually `http://localhost:5173`).

## Repo layout

```
index.html                     page shell and fonts
package.json                   scripts and dependencies
package-lock.json              locked dependency versions
vite.config.js                 Vite config (base comes from VITE_BASE)
public/frames/frame-1..7.png   the 7 portrait frames
src/main.jsx                   React entry point
src/App.jsx                    renders the page
src/index.css                  global reset/fonts
src/components/Landing.jsx     sections, scroll logic, mobile menu
src/components/landing.css     all page styling
src/data/content.js            all text and the nav tab list
src/data/frames.js             frame path generator
```

`dist/` and `node_modules/` are ignored by Git, so they stay local.

## Common edits

- **Text, tabs, cards:** `src/data/content.js`.
- **Section colors:** the `.pf-stage .pf-*` rules in `src/components/landing.css`.
- **Intro band color:** `.pf-band` in `landing.css`.
- **Scroll timing / blur:** the `measure()` function in `src/components/Landing.jsx`; total intro scroll is `.pf-wrap { height: calc(100svh + 6300px) }`.

## Publish to GitHub Pages

1. Create a public repo, e.g. `ashvro/portfolio`.
2. Set `base: "/portfolio/"` in `vite.config.js` (use `/` only for a root `ashvro.github.io` site), so frame and asset paths resolve correctly.
3. Run `npm run build` and deploy the `dist` folder — either with a GitHub Actions workflow or a `gh-pages` branch.
4. The site will be at `https://ashvro.github.io/portfolio/`.
