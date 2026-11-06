#!/usr/bin/env node
/**
 * Develop the frontend against the compiler-core that sits next to this repo
 * (../DSLCompiler_Backend/packages/compiler-core) instead of the version
 * published on npm, so a language change never needs an npm release just to
 * be tried or tested here.
 *
 *   npm run core:local      build the sibling core and link it into node_modules
 *   npm run core:published  go back to exactly what package-lock.json says
 *   npm run core:status     which one is active, and which language version
 *
 * It uses `npm install --no-save`: package.json and package-lock.json are never
 * touched, so a local link can't leak into a commit or into the Vercel build.
 * Override the location with COMPILER_CORE_DIR.
 */
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreDir = resolve(root, process.env.COMPILER_CORE_DIR ?? "../DSLCompiler_Backend/packages/compiler-core");
const backendDir = resolve(coreDir, "../..");
const installed = resolve(root, "node_modules/@saramariaojeda9559/compiler-core");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

function status() {
  if (!existsSync(installed)) return console.log("compiler-core is not installed. Run `npm ci`.");
  const linked = lstatSync(installed).isSymbolicLink();
  const { version } = JSON.parse(readFileSync(resolve(installed, "package.json"), "utf8"));
  console.log(`compiler-core ${version} — ${linked ? `LOCAL (linked to ${coreDir})` : "published (npm)"}`);
}

const command = process.argv[2] ?? "status";

if (command === "local") {
  if (!existsSync(resolve(coreDir, "package.json"))) {
    console.error(`No compiler-core found at ${coreDir}.\nClone DSLCompiler_Backend next to this repo or set COMPILER_CORE_DIR.`);
    process.exit(1);
  }
  console.log("Building the sibling compiler-core…");
  run(npm, ["run", "build", "--workspace=packages/compiler-core"], backendDir);
  console.log("Linking it into node_modules (no changes to package.json / package-lock.json)…");
  run(npm, ["install", "--no-save", "--no-audit", "--no-fund", coreDir], root);
  status();
} else if (command === "published") {
  run(npm, ["ci", "--no-audit", "--no-fund"], root);
  status();
} else {
  status();
}
