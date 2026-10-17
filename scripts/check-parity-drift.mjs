#!/usr/bin/env node
// Parity drift (ADR 0017, decision 1). Each Flutter parity checklist names
// the reference commit it was checked against and the paths of its reference
// component. A commit that touched those paths and is not part of the
// reference commit means the checklist describes an older reference: the
// component has to be reviewed again and the checklist brought up to date.
//
//   node scripts/check-parity-drift.mjs
//
// It needs the full history (`fetch-depth: 0` in CI). It fails on a stale
// checklist, on one without a reference commit or paths, and on an exception
// that no longer applies. A checklist that cannot be made current yet goes in
// packages/flutter/parity/drift-exceptions.json with the reason, and comes
// out again when it is reviewed.
//
// It also checks that the Flutter workflow runs on every reference path, so
// a change to a reference component always reaches this check.

import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const PARITY_DIR = "packages/flutter/parity";
export const EXCEPTIONS = `${PARITY_DIR}/drift-exceptions.json`;
export const WORKFLOW = ".github/workflows/flutter.yml";

/** The reference commit and paths a checklist names. */
export function parseChecklist(text) {
  const commit = /^Reference commit: `([0-9a-f]{7,40})`/m.exec(text)?.[1] ?? "";
  const line = /^Reference paths: (.+)$/m.exec(text)?.[1] ?? "";
  const paths = [...line.matchAll(/`([^`]+)`/g)].map(([, path]) => path);
  return { commit, paths };
}

/**
 * The exception list: an array of { checklist, reason }. Returns the entries
 * and the problems with the file itself.
 */
export function parseExceptions(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { entries: [], problems: [`${EXCEPTIONS} is not valid JSON: ${error.message}`] };
  }
  if (!Array.isArray(data)) {
    return { entries: [], problems: [`${EXCEPTIONS} must hold an array.`] };
  }
  const problems = [];
  const entries = [];
  for (const entry of data) {
    const checklist = typeof entry?.checklist === "string" ? entry.checklist : "";
    const reason = typeof entry?.reason === "string" ? entry.reason.trim() : "";
    if (!checklist || !reason) {
      problems.push(`${EXCEPTIONS}: every entry needs a checklist and a reason.`);
      continue;
    }
    entries.push({ checklist, reason });
  }
  return { entries, problems };
}

/** Each `paths:` filter of the workflow's triggers (pull_request, push), in order. */
export function workflowPaths(yaml) {
  return [...yaml.matchAll(/^ {4}paths:\n((?: {6}- .+\n)+)/gm)].map(([, block]) =>
    [...block.matchAll(/- "?([^"\n]+?)"?\n/g)].map(([, path]) => path.trim()),
  );
}

/** Whether one filter entry (a path, or a directory followed by `/**`) covers a path. */
export function covers(filter, path) {
  if (filter.endsWith("/**")) {
    const dir = filter.slice(0, -3);
    return path === dir || path.startsWith(`${dir}/`);
  }
  return filter === path;
}

/** Reference paths that no filter entry covers. */
export function uncoveredPaths(filters, paths) {
  return paths.filter((path) => !filters.some((filter) => covers(filter, path)));
}

function git(root, args) {
  const { status, stdout } = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { status, stdout: stdout.trim() };
}

/** @returns {{ rows: string[], problems: string[] }} */
export function checkDrift(root) {
  const dir = resolve(root, PARITY_DIR);
  const checklists = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  const exceptionsFile = resolve(root, EXCEPTIONS);
  const { entries, problems } = existsSync(exceptionsFile)
    ? parseExceptions(readFileSync(exceptionsFile, "utf8"))
    : { entries: [], problems: [`${EXCEPTIONS} is missing; an empty list is [].`] };
  const excepted = new Map(entries.map((entry) => [entry.checklist, entry.reason]));
  const filters = workflowPaths(readFileSync(resolve(root, WORKFLOW), "utf8"));
  if (filters.length === 0) problems.push(`${WORKFLOW} has no paths filter to check.`);
  const rows = [];
  const stale = new Set();

  for (const name of checklists) {
    const file = `${PARITY_DIR}/${name}`;
    const { commit, paths } = parseChecklist(readFileSync(resolve(dir, name), "utf8"));
    if (!commit || paths.length === 0) {
      problems.push(`${file}: no reference commit or reference paths.`);
      continue;
    }
    const missing = new Set(filters.flatMap((filter) => uncoveredPaths(filter, paths)));
    for (const path of missing) {
      problems.push(`${file}: ${WORKFLOW} does not run on the reference path ${path}.`);
    }
    if (git(root, ["cat-file", "-e", `${commit}^{commit}`]).status !== 0) {
      problems.push(
        `${file}: reference commit ${commit} is not in the history (a shallow clone?).`,
      );
      continue;
    }
    const last = git(root, ["log", "-1", "--format=%H", "--", ...paths]).stdout;
    if (!last) {
      problems.push(`${file}: no commit touches its reference paths; check them.`);
      continue;
    }
    if (git(root, ["merge-base", "--is-ancestor", last, commit]).status === 0) {
      rows.push(`- \`${file}\`: up to date with \`${commit.slice(0, 8)}\``);
      continue;
    }
    // A commit cannot name itself, so a change that updates the reference and
    // its checklist together counts as reviewed.
    const changed = git(root, ["show", "--name-only", "--format=", last]).stdout.split("\n");
    if (changed.includes(file)) {
      rows.push(`- \`${file}\`: updated with the reference in \`${last.slice(0, 8)}\``);
      continue;
    }
    stale.add(name);
    const message = `${file}: out of date, ${last.slice(0, 8)} changed the reference after ${commit.slice(0, 8)}`;
    if (excepted.has(name)) {
      rows.push(`- \`${file}\`: out of date, excepted: ${excepted.get(name)}`);
    } else {
      rows.push(`- \`${file}\`: out of date, \`${last.slice(0, 8)}\` changed the reference`);
      problems.push(
        `${message}. Review the component against the reference, update the checklist and its reference commit.`,
      );
    }
  }
  for (const name of excepted.keys()) {
    if (!checklists.includes(name)) {
      problems.push(`${EXCEPTIONS}: ${name} is not a checklist in ${PARITY_DIR}.`);
    } else if (!stale.has(name)) {
      problems.push(`${EXCEPTIONS}: ${name} is up to date; remove its exception.`);
    }
  }
  return { rows, problems };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const { rows, problems } = checkDrift(root);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      ["## Parity drift", "", ...rows, "", ...problems.map((p) => `- ${p}`), ""].join("\n"),
    );
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`✖ ${problem}`);
    process.exit(1);
  }
  console.log(`Parity drift: ${rows.length} checklists checked, none out of date.`);
}
