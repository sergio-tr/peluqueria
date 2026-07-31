#!/usr/bin/env node

const branch = process.argv[2] ?? process.env.GITHUB_HEAD_REF ?? "";

if (!branch) {
  console.error("Branch name is required.");
  process.exit(1);
}

const allowed = /^(feature|bugfix|fix|update|refactor|security|test|docs|chore|release)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

if (!allowed.test(branch)) {
  console.error(
    `Invalid branch "${branch}". Expected <type>/<kebab-case> with an allowed type.`,
  );
  process.exit(1);
}

if (branch === "main" || branch.endsWith("/main")) {
  console.error("main cannot be used as a work branch.");
  process.exit(1);
}

console.log(`Valid branch: ${branch}`);
