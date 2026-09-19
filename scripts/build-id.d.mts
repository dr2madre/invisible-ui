// Types for build-id.mjs: the Vue example's config is type-checked by vue-tsc.
import type { AstroIntegration } from "astro";
import type { Plugin } from "vite";

export const BUILD_ID_FILE: string;
export interface BuildId {
  root: string;
  head: string | null;
  dirty: boolean;
  builtAt: string;
}
export function buildId(repoRoot: string): BuildId;
export function writeBuildId(outDir: string, repoRoot: string): void;
export function buildIdIntegration(repoRoot: string): AstroIntegration;
export function buildIdPlugin(repoRoot: string): Plugin;
