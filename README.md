# NexGen Sign Script Builder

A static React app that converts produce master / sale / COOL CSVs into a ready-to-install Tampermonkey userscript for NexGen365 sign automation.

## Local development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. **Create a new GitHub repo** (e.g. `nexgen-builder`). Public or private both work — Pages is free for both on personal accounts.
2. **Push this folder** to the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. **Enable Pages**: in the repo on github.com, go to **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. (You only do this once.)
4. The workflow at `.github/workflows/deploy.yml` runs automatically on every push to `main`. First deploy takes ~1–2 minutes.
5. Your site will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
   The exact URL is shown at the bottom of the workflow run page once it finishes.

## How it works

- **Vite + React + Tailwind**, single-page app, no backend, no routing.
- `vite.config.js` uses `base: "./"` so the build works at any GitHub Pages URL without editing config.
- The userscript is generated entirely client-side — your CSV data never leaves your browser.

## Updating

Push to `main` → Actions rebuilds and redeploys automatically. No manual steps.
