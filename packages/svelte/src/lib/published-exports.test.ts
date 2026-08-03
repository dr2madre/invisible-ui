// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Every path the `exports` map points at has to be inside `files`, otherwise
// npm publishes a manifest whose entrypoints resolve to nothing: the package
// installs, the import fails. Adding a component means adding both entries,
// and this test is what remembers it.

type ExportEntry = string | { [condition: string]: ExportEntry };

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
) as { files: string[]; exports: Record<string, ExportEntry> };

const published = (target: string): boolean =>
  manifest.files.some((entry) => target === entry || target.startsWith(`${entry}/`));

const targetsOf = (entry: ExportEntry): string[] =>
  typeof entry === "string" ? [entry] : Object.values(entry).flatMap(targetsOf);

describe("published exports", () => {
  const sourceTargets = [
    ...new Set(
      targetsOf(manifest.exports)
        .filter((target) => target.startsWith("./src/"))
        .map((target) => target.slice(2)),
    ),
  ].sort();

  it("cover every source file the exports map resolves to", () => {
    expect(sourceTargets.filter((target) => !published(target))).toEqual([]);
  });

  it("read the whole styled catalog, not a handful of entries", () => {
    expect(sourceTargets.length).toBeGreaterThan(70);
  });
});
