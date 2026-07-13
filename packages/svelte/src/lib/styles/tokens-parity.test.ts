// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards that the DTCG source (tokens.json — the design-owned single source)
// stays in sync with the runtime stylesheet (tokens.css). The semantic `style`
// tier resolves through `palette`; both must equal the live `--ds-*` values.

type TokenNode = { $value?: string; $type?: string } & {
  [key: string]: TokenNode | string | undefined;
};

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const tokens = JSON.parse(read("../../../tokens/tokens.json")) as TokenNode;
const css = read("./tokens.css");

const cssVar = (name: string): string => {
  const m = new RegExp(`--ds-${name}:\\s*([^;]+);`).exec(css);
  if (!m) throw new Error(`--ds-${name} not found in tokens.css`);
  const raw = m[1]!.trim();
  // The style tier references the named primitive scale (e.g.
  // `--ds-brand-primary: var(--ds-purple-500)`); resolve one hop so parity is
  // checked on the underlying raw value, not the reference string.
  const ref = /^var\(\s*(--ds-[\w-]+)\s*\)$/.exec(raw);
  return ref ? cssVar(ref[1]!.replace(/^--ds-/, "")) : raw.toLowerCase();
};

const walk = (path: string): TokenNode => {
  let node: TokenNode = tokens;
  for (const key of path.split(".")) {
    const next = node[key];
    if (next === undefined || typeof next === "string") throw new Error(`no token at ${path}`);
    node = next;
  }
  return node;
};

/** Resolve a token's `$value`, following `{palette.x.y}` aliases. */
const resolve = (value: string): string => {
  const alias = /^\{(.+)\}$/.exec(value);
  return alias ? resolve(walk(alias[1]!).$value as string) : value;
};
const val = (path: string) => resolve(walk(path).$value as string).toLowerCase();

describe("design tokens — DTCG source ↔ runtime parity", () => {
  it("brand: style.primary/secondary match --ds-brand-*", () => {
    expect(val("style.primary.default")).toBe(cssVar("brand-primary"));
    expect(val("style.primary.hover")).toBe(cssVar("brand-primary-hover"));
    expect(val("style.secondary.default")).toBe(cssVar("brand-secondary"));
    expect(val("style.secondary.hover")).toBe(cssVar("brand-secondary-hover"));
  });

  it("feedback: style.{info,success,warning,danger} match --ds-feedback-*", () => {
    expect(val("style.info.default")).toBe(cssVar("feedback-info"));
    expect(val("style.success.default")).toBe(cssVar("feedback-success"));
    expect(val("style.warning.default")).toBe(cssVar("feedback-warning"));
    expect(val("style.danger.default")).toBe(cssVar("feedback-danger"));
    expect(val("style.danger.hover")).toBe(cssVar("feedback-danger-hover"));
  });

  it("palette.grey.* matches the --ds-neutral-* ramp", () => {
    const grey = walk("palette.grey");
    for (const weight of Object.keys(grey).filter((k) => !k.startsWith("$"))) {
      expect(val(`palette.grey.${weight}`)).toBe(cssVar(`neutral-${weight}`));
    }
  });

  it("radius.* matches --ds-radius-*", () => {
    expect(val("radius.control")).toBe(cssVar("radius-control"));
    expect(val("radius.surface")).toBe(cssVar("radius-surface"));
    expect(val("radius.pill")).toBe(cssVar("radius-pill"));
  });
});
