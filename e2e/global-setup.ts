import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

// Before any browser test: the server that answers must serve this checkout,
// built from the commit that is checked out, after the last source edit.
// Two `astro preview` daemons from another checkout once served an older
// docs site to a worktree's tests on the same port; they passed.
//
// DS_E2E_ALLOW_STALE=1 skips the freshness rules (dirty tree, sources newer
// than the build), never the identity rules (another root, another commit).

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** Directories whose files reach the served sites. */
const SOURCES = [
  "core/src",
  "packages/svelte/src",
  "packages/vue/src",
  "packages/react/src",
  "packages/elements/src",
  "packages/docs/src",
  "packages/docs/public",
  "examples/vue/src",
];

function newestMtime(dir: string): number {
  let newest = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    newest = Math.max(newest, stat.isDirectory() ? newestMtime(path) : stat.mtimeMs);
  }
  return newest;
}

interface BuildId {
  root: string;
  head: string | null;
  dirty: boolean;
  builtAt: string;
}

async function check(site: string, url: string, head: string, newest: number) {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`[${site}] ${url} did not answer: ${String(error)}`);
  }
  if (!response.ok) {
    throw new Error(
      `[${site}] ${url} answered ${response.status}: the server serves a build from before this check, or another project. Rebuild and restart it.`,
    );
  }
  const id = (await response.json()) as BuildId;
  if (resolve(id.root) !== root) {
    throw new Error(
      `[${site}] the server on ${new URL(url).origin} serves another checkout (${id.root}). Stop it, then run again.`,
    );
  }
  if (id.head !== head) {
    throw new Error(
      `[${site}] the served build is from commit ${id.head?.slice(0, 7)}, HEAD is ${head.slice(0, 7)}. Rebuild.`,
    );
  }
  if (process.env.DS_E2E_ALLOW_STALE) return;
  if (Date.parse(id.builtAt) < newest) {
    throw new Error(
      `[${site}] a source changed after the served build (${id.builtAt}). Rebuild, or set DS_E2E_ALLOW_STALE=1 knowingly.`,
    );
  }
}

export default async function globalSetup() {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const newest = Math.max(...SOURCES.map((dir) => newestMtime(join(root, dir))));
  const docs = `${process.env.DS_E2E_DOCS_BASE ?? "http://127.0.0.1:4321/invisible-ui/"}.build-id.json`;
  const vue = `${process.env.DS_E2E_VUE_ORIGIN ?? "http://127.0.0.1:4390"}/.build-id.json`;
  await check("docs", docs, head, newest);
  await check("vue example", vue, head, newest);
}
