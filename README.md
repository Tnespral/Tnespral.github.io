# Tiago Fernández-Nespral — Project Portfolio

The source for [tnespral.github.io](https://tnespral.github.io): an Astro portfolio presenting completed data science and machine learning projects through concise explanations, results and interactive figures.

## Run locally

Node.js 24 and pnpm are used by the deployment workflow.

```powershell
pnpm install
pnpm dev
```

The local site is available at `http://127.0.0.1:4321` by default. Before submitting changes, run:

```powershell
pnpm check
pnpm build
```

## Editing

- Project copy and metadata live in `src/content/site.ts`.
- Project routes live in `src/pages/projects/`.
- Reusable components are in `src/components/`.
- Public images and generated website-safe figures are in `public/`.
- Image licences and attribution are recorded in `ASSET_CREDITS.md` and `ASSET_NOTICES.md`.

`pnpm sync:model-assets` copies only aggregate, website-safe coral outputs from the local model-results folder. It does not copy raw images, split manifests, checkpoints or private review exports.

Pushes to `main` are checked, built and deployed to GitHub Pages through the workflow in `.github/workflows/deploy.yml`.
