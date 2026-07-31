#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function run(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

let branch;
try {
  branch = run(["branch", "--show-current"]);
} catch {
  console.error("Unable to determine current branch.");
  process.exit(1);
}

if (!branch) {
  console.error("Detached HEAD is not allowed for implementation work.");
  process.exit(1);
}

if (branch === "main") {
  let remoteMainExists = false;
  try {
    run(["show-ref", "--verify", "--quiet", "refs/remotes/origin/main"]);
    remoteMainExists = true;
  } catch {
    remoteMainExists = false;
  }

  if (remoteMainExists) {
    console.error("Direct commits on main are prohibited.");
    process.exit(1);
  }

  console.warn("Allowing one-time local main bootstrap because origin/main does not exist.");
  process.exit(0);
}

const allowed =
  /^(feature|bugfix|fix|update|refactor|security|test|docs|chore|release)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

if (!allowed.test(branch)) {
  console.error(
    `Invalid branch "${branch}". Expected <type>/<kebab-case> with an allowed type.`,
  );
  process.exit(1);
}

console.log(`Current work branch is valid: ${branch}`);
