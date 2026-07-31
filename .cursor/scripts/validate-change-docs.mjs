#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const baseRef = process.env.GOVERNANCE_BASE_REF || process.env.GITHUB_BASE_REF || "main";
let mergeBase;

try {
  git(["fetch", "origin", baseRef, "--quiet"]);
} catch {
  // CI checkout or local repository may already contain the ref.
}

try {
  mergeBase = git(["merge-base", "HEAD", `origin/${baseRef}`]);
} catch {
  try {
    mergeBase = git(["merge-base", "HEAD", baseRef]);
  } catch {
    console.error(`Unable to determine merge base against ${baseRef}.`);
    process.exit(1);
  }
}

const output = git(["diff", "--name-only", `${mergeBase}...HEAD`]);
const changed = output ? output.split(/\r?\n/).filter(Boolean) : [];

if (changed.length === 0) {
  console.log("No changed files.");
  process.exit(0);
}

const nonDocumentation = changed.filter((path) => !path.startsWith("docs/"));

const changeRecords = changed.filter(
  (path) =>
    path.startsWith("docs/changes/") &&
    path.endsWith(".md") &&
    !path.endsWith("/README.md") &&
    !path.endsWith("/TEMPLATE.md"),
);

if (nonDocumentation.length > 0 && changeRecords.length === 0) {
  console.error("Code/config/infrastructure changed without a docs/changes record.");
  console.error(nonDocumentation.join("\n"));
  process.exit(1);
}

const requiredHeadings = [
  "## Summary",
  "## Recovery phase",
  "## Scope included",
  "## Scope excluded",
  "## Architecture impact",
  "## Security and privacy impact",
  "## Testing evidence",
  "## Deployment and rollback",
  "## Documentation updated",
  "## Remaining risks",
  "## Verification status",
];

for (const record of changeRecords) {
  const content = fs.readFileSync(record, "utf8");
  const missing = requiredHeadings.filter((heading) => !content.includes(heading));
  if (missing.length > 0) {
    console.error(`${record} is missing required headings:`);
    console.error(missing.join("\n"));
    process.exit(1);
  }
}

console.log(`Documentation gate passed for ${changed.length} changed files.`);
