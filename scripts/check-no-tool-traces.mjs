#!/usr/bin/env node
/**
 * Refuse names and text that mention an AI tool.
 *
 * The rule is written in CONTRIBUTING.md and in CLAUDE.md, and a session that
 * starts with no memory of either still has to obey it, so it is checked here
 * as well: the branch name, the commit messages a branch adds on top of main,
 * and the git author of each of them.
 *
 * Usage: node scripts/check-no-tool-traces.mjs [--message <file>]
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const TOOL = /\b(claude|anthropic|copilot|chatgpt|openai|gpt-4|cursor\.sh)\b/i;
const TRAILER = /^(co-authored-by|generated with|🤖)/im;

const run = (command) => {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const problems = [];

const messageFile = process.argv.includes("--message")
  ? process.argv[process.argv.indexOf("--message") + 1]
  : null;

if (messageFile) {
  // Called from the commit-msg hook: the message is not in history yet.
  const message = readFileSync(messageFile, "utf8");
  if (TOOL.test(message)) problems.push("the commit message names a tool");
  if (TRAILER.test(message)) problems.push("the commit message carries a tool trailer");
} else {
  const branch = run("git rev-parse --abbrev-ref HEAD");
  if (TOOL.test(branch)) {
    problems.push(`the branch is named "${branch}": rename it with git branch -m`);
  }

  const base = run("git merge-base origin/main HEAD") || run("git rev-parse HEAD~20");
  const range = base ? `${base}..HEAD` : "HEAD";
  const log = run(`git log ${range} --format="%H%n%an <%ae>%n%B%n---"`);
  for (const entry of log.split("\n---").filter((part) => part.trim())) {
    const [hash, author, ...rest] = entry.trim().split("\n");
    const body = rest.join("\n");
    const short = hash?.slice(0, 8);
    if (TOOL.test(author ?? "")) problems.push(`${short} is authored by "${author}"`);
    if (TOOL.test(body)) problems.push(`${short} names a tool in its message`);
    if (TRAILER.test(body)) problems.push(`${short} carries a tool trailer`);
  }
}

if (problems.length) {
  console.error("This repository carries no trace of the tools used to write it.\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nSee CONTRIBUTING.md, 'Branching and merging' and 'Authorship & human oversight'.");
  process.exit(1);
}
