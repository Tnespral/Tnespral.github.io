# Editing the portfolio text

Keep the local preview running with:

```powershell
npm run dev
```

Edit the homepage introduction and all coral-project prose in
`src/content/site.ts`. Save the file and Astro will update the open page
automatically.

The results section is in the same `coralCopy.results` object. Numerical values
shown inside the scorecards and diagrams live in the corresponding component
files under `src/components/`; change those only when a new evaluation run
replaces the current results.

Project titles, dates and homepage-card descriptions live in
`src/data/projects.ts`.

The text files use ordinary quoted strings. Keep the quotation marks and comma
around any sentence you replace. There is no separate editing interface or
database to maintain.
