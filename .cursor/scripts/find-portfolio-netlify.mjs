#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const workspace = process.argv[2] ?? "C:\\Users\\Sergio\\workspaces";
const currentRepo = path.resolve(workspace, "peluqueria");

if (!fs.existsSync(workspace)) {
  console.error(`Workspace not found: ${workspace}`);
  process.exit(1);
}

const candidates = [];

for (const entry of fs.readdirSync(workspace, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const repo = path.resolve(workspace, entry.name);
  if (repo === currentRepo) continue;

  const evidence = [];
  for (const relative of [
    "netlify.toml",
    ".github/workflows",
    "package.json",
    "README.md",
    ".netlify",
  ]) {
    if (fs.existsSync(path.join(repo, relative))) evidence.push(relative);
  }

  if (evidence.includes("netlify.toml") || evidence.includes(".netlify")) {
    let remote = "";
    try {
      remote = execFileSync("git", ["-C", repo, "remote", "get-url", "origin"], {
        encoding: "utf8",
      }).trim();
    } catch {}

    candidates.push({ repo, evidence, remote });
  }
}

console.log(JSON.stringify(candidates, null, 2));

if (candidates.length === 0) {
  console.error("No sibling Netlify project found.");
  process.exit(2);
}
