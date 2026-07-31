#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const baseRef = process.env.GOVERNANCE_BASE_REF || process.env.GITHUB_BASE_REF || "main";

try {
  git(["fetch", "origin", baseRef, "--quiet"]);
} catch {}

let mergeBase;
try {
  mergeBase = git(["merge-base", "HEAD", `origin/${baseRef}`]);
} catch {
  mergeBase = git(["merge-base", "HEAD", baseRef]);
}

const subjects = git(["log", "--format=%s", `${mergeBase}..HEAD`])
  .split(/\r?\n/)
  .filter(Boolean)
  // GitHub Actions checks out a temporary merge commit whose subject is not conventional.
  .filter((subject) => !/^Merge /i.test(subject))
  // Strip UTF-8 BOM if a commit message was written with a BOM-prefixed editor.
  .map((subject) => subject.replace(/^\uFEFF/, ""));

const conventional =
  /^(feat|fix|refactor|test|docs|chore|build|ci|perf|style|revert)(\([a-z0-9._/-]+\))?!?: [a-z0-9][^\r\n]{1,100}$/;

for (const subject of subjects) {
  if (/\bcursor\b/i.test(subject)) {
    console.error(`Forbidden tool attribution in commit: ${subject}`);
    process.exit(1);
  }
  if (!conventional.test(subject)) {
    console.error(`Invalid commit subject: ${subject}`);
    process.exit(1);
  }
}

console.log(`Validated ${subjects.length} commit subject(s).`);
