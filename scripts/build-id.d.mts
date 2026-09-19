// Types for build-id.mjs: the Vue example's config is type-checked by vue-tsc,
// and the Playwright global setup imports it from TypeScript.
import type { AstroIntegration } from "astro";
import type { Plugin } from "vite";

export const BUILD_ID_FILE: string;
export type Site = "docs" | "vue-example";
export const SITE_INPUTS: Record<Site, readonly string[]>;
export interface ExpectedBuildId {
  site: Site;
  checkout: string;
  head: string | null;
  inputs: string;
}
export interface BuildId extends ExpectedBuildId {
  builtAt: string;
}
export function checkoutFingerprint(repoRoot: string): string;
export function expectedBuildId(site: Site, repoRoot: string): ExpectedBuildId;
export function buildId(site: Site, repoRoot: string): BuildId;
export function writeBuildId(site: Site, outDir: string, repoRoot: string): void;
export function parseStamp(text: string): unknown;
export function verifyBuildId(
  served: unknown,
  expected: ExpectedBuildId,
  options?: { allowStale?: boolean },
): string | null;
export function buildIdIntegration(site: Site, repoRoot: string): AstroIntegration;
export function buildIdPlugin(site: Site, repoRoot: string): Plugin;
