import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { expectedBuildId, verifyBuildId, type Site } from "../scripts/build-id.mjs";

// Before any browser test: the server that answers must serve this checkout,
// at the commit that is checked out, built from the sources as they are now.
// Two `astro preview` daemons from another checkout once served an older
// docs site to a worktree's tests on the same port; they passed.
//
// DS_E2E_ALLOW_STALE=1 skips the sources rule only. Another checkout or
// another commit is refused whatever the environment says.

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function fetchStamp(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`${url} did not answer: ${String(error)}`);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
  return response.json();
}

async function check(site: Site, url: string) {
  const problem = verifyBuildId(await fetchStamp(url), expectedBuildId(site, root), {
    allowStale: Boolean(process.env.DS_E2E_ALLOW_STALE),
  });
  if (problem) throw new Error(`[${site}] ${new URL(url).origin}: ${problem}`);
}

export default async function globalSetup() {
  const docs = process.env.DS_E2E_DOCS_BASE ?? "http://127.0.0.1:4321/invisible-ui/";
  const vue = process.env.DS_E2E_VUE_ORIGIN ?? "http://127.0.0.1:4390";
  await check("docs", `${docs}.build-id.json`);
  await check("vue-example", `${vue}/.build-id.json`);
}
