#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const branch = execFileSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).trim();

run("node", [".cursor/scripts/validate-branch-name.mjs", branch]);
run("node", [".cursor/scripts/validate-change-docs.mjs"]);
run("git", ["diff", "--check"]);

if (!fs.existsSync("package.json")) {
  console.log("No package.json found; repository governance checks completed.");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts ?? {};

for (const name of ["lint", "typecheck", "test", "build"]) {
  if (scripts[name]) {
    console.log(`Running npm script: ${name}`);
    run("npm", ["run", name]);
  } else {
    console.log(`Skipping missing npm script: ${name}`);
  }
}

console.log("PR readiness checks passed.");
