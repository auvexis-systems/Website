// Moves the tsc output into src/scripts/main.js, which is what build.mjs
// copies into dist/scripts/main.js. Kept as a separate tiny step because
// tsc refuses outDir === rootDir (see tsconfig.json comments in README.md).
import { cpSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const src = path.join(ROOT, "build", "ts-out", "main.js");
const dest = path.join(ROOT, "src", "scripts", "main.js");

if (!existsSync(src)) {
  console.error("tsc output not found at", src);
  process.exit(1);
}
cpSync(src, dest);
rmSync(path.join(ROOT, "build", "ts-out"), { recursive: true, force: true });
console.log("Compiled TypeScript →", path.relative(ROOT, dest));
