#!/usr/bin/env node
import fs from "node:fs";

function readMessage() {
  const textIndex = process.argv.indexOf("--text");
  if (textIndex >= 0) {
    return process.argv[textIndex + 1] ?? "";
  }

  const file = process.argv[2];
  if (!file) {
    throw new Error("Pass a commit message file or --text.");
  }
  return fs.readFileSync(file, "utf8").trim();
}

const message = readMessage();
const firstLine = message.split(/\r?\n/, 1)[0].trim();

const forbidden = [
  /\bcursor\b/i,
  /generated\s+by\s+cursor/i,
  /co-authored-by:.*cursor/i,
];

for (const pattern of forbidden) {
  if (pattern.test(message)) {
    console.error("Commit message contains forbidden tool attribution.");
    process.exit(1);
  }
}

const conventional =
  /^(feat|fix|refactor|test|docs|chore|build|ci|perf|style|revert)(\([a-z0-9._/-]+\))?!?: [a-z0-9][^\r\n]{1,100}$/;

if (!conventional.test(firstLine)) {
  console.error(
    `Invalid Conventional Commit: "${firstLine}". Expected type(scope): lowercase imperative description.`,
  );
  process.exit(1);
}

console.log("Valid commit message.");
