#!/usr/bin/env node
/**
 * Phase 9 production DoD smoke checklist helper.
 * Does NOT run Replicate or automate prod — operator executes manually (OP-017).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, "evidence-template.json");
const EVIDENCE_DIR = path.resolve(process.cwd(), "smoke-evidence");

const CHECKLIST_LINES = [
  "Production DoD smoke — Phase 9",
  "DoD status: NOT VERIFIED (until operator completes OP-017 with evidence)",
  "",
  "Preflight (OP-016): health, gate, cron, webhook, no mock",
  "Flow: Acceso → foto → corte → gen real → solicitud → revisión → propuesta",
  "      → Demo Inbox → confirm → agenda bloqueada → solape rechazado",
  "",
  "Full checklist: docs/dod-smoke-checklist.md",
  "Initialize evidence: npm run smoke:dod -- --init",
  "Validate evidence:   npm run smoke:dod -- --validate smoke-evidence/dod-smoke-<runId>.json",
];

function usage() {
  console.info(`Usage:
  node scripts/production-dod-smoke/run-checklist.mjs              Print checklist summary
  node scripts/production-dod-smoke/run-checklist.mjs --init       Create PENDING evidence JSON
  node scripts/production-dod-smoke/run-checklist.mjs --validate <file>  Fail if any PENDING remains`);
}

function isPending(value) {
  return value === "PENDING" || value === "" || value == null;
}

function collectPending(obj, prefix = "") {
  const pending = [];
  if (typeof obj !== "object" || obj === null) {
    if (isPending(obj)) pending.push(prefix || "(root)");
    return pending;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      pending.push(...collectPending(item, `${prefix}[${i}]`));
    });
    return pending;
  }
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (key === "dodStatus" && value === "NOT_VERIFIED") continue;
    if (typeof value === "object" && value !== null) {
      pending.push(...collectPending(value, pathKey));
    } else if (isPending(value)) {
      pending.push(pathKey);
    }
  }
  return pending;
}

function initEvidence() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`Template not found: ${TEMPLATE}`);
    process.exit(1);
  }
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const runId = randomUUID().slice(0, 8);
  const record = JSON.parse(fs.readFileSync(TEMPLATE, "utf8"));
  record.runId = runId;
  record.startedAt = new Date().toISOString();
  const outfile = path.join(EVIDENCE_DIR, `dod-smoke-${runId}.json`);
  fs.writeFileSync(outfile, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.info(`[dod-smoke] Created PENDING evidence: ${outfile}`);
  console.info("[dod-smoke] DoD status remains NOT_VERIFIED until all steps pass.");
}

function validateEvidence(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Evidence file not found: ${filePath}`);
    process.exit(1);
  }
  const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const pending = collectPending(record);
  if (record.dodStatus !== "VERIFIED") {
    console.error(`[dod-smoke] dodStatus is "${record.dodStatus}" — expected VERIFIED after full run.`);
    process.exit(1);
  }
  if (pending.length > 0) {
    console.error(`[dod-smoke] ${pending.length} PENDING field(s) remain:`);
    pending.slice(0, 20).forEach((p) => console.error(`  - ${p}`));
    if (pending.length > 20) console.error(`  ... and ${pending.length - 20} more`);
    process.exit(1);
  }
  console.info(`[dod-smoke] Evidence validated: ${filePath}`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}
if (args.includes("--init")) {
  initEvidence();
  process.exit(0);
}
const validateIdx = args.indexOf("--validate");
if (validateIdx !== -1) {
  const file = args[validateIdx + 1];
  if (!file) {
    console.error("--validate requires a file path");
    process.exit(1);
  }
  validateEvidence(path.resolve(file));
  process.exit(0);
}

CHECKLIST_LINES.forEach((line) => console.info(line));
