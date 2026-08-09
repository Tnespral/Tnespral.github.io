import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(
  process.env.CORAL_PORTFOLIO_OUTPUT || path.join(root, "..", "portfolio_outputs_clean", "portfolio"),
);
const figureTarget = path.join(root, "public", "figures", "coral");
const dataTarget = path.join(root, "public", "data", "coral-portfolio-summary.json");
const allowedFigures = new Set([
  "data_audit_flow",
  "split_composition",
  "model_architecture",
  "model_comparison",
  "decision_policy",
  "calibration",
  "coverage_error",
  "source_robustness",
  "confusion_matrix",
  "training_history",
]);

if (!existsSync(source)) {
  throw new Error(`Aggregate portfolio output not found: ${source}`);
}
if (!figureTarget.startsWith(path.join(root, "public") + path.sep)) {
  throw new Error("Refusing to sync outside the site's public directory.");
}

await rm(figureTarget, { recursive: true, force: true });
for (const mode of ["light", "dark"]) {
  const destination = path.join(figureTarget, mode);
  await mkdir(destination, { recursive: true });
  for (const name of allowedFigures) {
    for (const extension of ["svg", "png"]) {
      const input = path.join(source, "figures", mode, `${name}.${extension}`);
      if (existsSync(input)) {
        await cp(input, path.join(destination, `${name}.${extension}`));
      }
    }
  }
}

const summarySource = path.join(source, "portfolio_summary.json");
if (existsSync(summarySource)) {
  const parsed = JSON.parse(await readFile(summarySource, "utf8"));
  await mkdir(path.dirname(dataTarget), { recursive: true });
  await writeFile(dataTarget, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
}

console.log(`Synced aggregate coral assets from ${source}`);
console.log("Private attention-review files were not considered.");
