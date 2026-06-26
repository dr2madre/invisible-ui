import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolvePath(process.cwd(), "src/lib/styles/tokens.css"), "utf8");

/**
 * Guards the theme token layer against contrast regressions. Resolves the
 * `--ds-color-*` semantic tokens (through `var()` and `color-mix()`) for both
 * themes and checks the meaningful pairs against WCAG 2 AA:
 * - body / button-label text → 4.5:1 (normal text, SC 1.4.3)
 * - FeedbackIcon glyph on a solid status → 3:1 (graphical object, SC 1.4.11)
 */

type RGB = [number, number, number];

function declarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

function pickBlock(re: RegExp): Record<string, string> {
  const body = css.match(re)?.[1] ?? "";
  return declarations(body);
}

const primitives = pickBlock(/:root\s*\{([^}]*--ds-neutral-0[^}]*)\}/);
const lightVars = { ...primitives, ...pickBlock(/\[data-theme="light"\]\s*\{([^}]*)\}/) };
const darkVars = { ...primitives, ...pickBlock(/\[data-theme="dark"\]\s*\{([^}]*)\}/) };

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function resolve(value: string, vars: Record<string, string>): RGB {
  const v = value.trim();
  if (v.startsWith("#")) return hexToRgb(v);

  if (v.startsWith("var(")) {
    const name = v.slice(4, v.indexOf(")")).split(",")[0].trim();
    return resolve(vars[name], vars);
  }

  if (v.startsWith("color-mix(")) {
    const inner = v.slice(v.indexOf("(") + 1, v.lastIndexOf(")"));
    const [, a, b] = inner.split(",").map((s) => s.trim()); // skip "in srgb"
    const [, aColor, aPct] = a.match(/^(.+?)\s+([\d.]+)%$/)!;
    const p = Number(aPct) / 100;
    const c1 = resolve(aColor, vars);
    const c2 = resolve(b, vars);
    return [0, 1, 2].map((i) => Math.round(p * c1[i] + (1 - p) * c2[i])) as RGB;
  }

  throw new Error(`Cannot resolve color: ${value}`);
}

function luminance([r, g, b]: RGB): number {
  const ch = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(fg: string, bg: string, vars: Record<string, string>): number {
  const [la, lb] = [luminance(resolve(`var(${fg})`, vars)), luminance(resolve(`var(${bg})`, vars))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe.each([
  ["light", lightVars],
  ["dark", darkVars],
])("token contrast (%s)", (_name, vars) => {
  it.each(["info", "success", "warning", "danger", "neutral"] as const)(
    "body text on the %s surface meets 4.5:1",
    (status) => {
      expect(
        contrast("--ds-color-text", `--ds-color-${status}-surface`, vars),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("on-emphasis text on the emphasis surface meets 4.5:1", () => {
    expect(
      contrast("--ds-color-on-emphasis", "--ds-color-emphasis-surface", vars),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["info", "success", "warning", "danger", "neutral"] as const)(
    "white glyph on the %s solid meets 3:1",
    (status) => {
      expect(contrast("--ds-color-on-status", `--ds-color-${status}`, vars)).toBeGreaterThanOrEqual(
        3,
      );
    },
  );

  it("primary button label meets 4.5:1", () => {
    expect(contrast("--ds-color-on-primary", "--ds-color-primary", vars)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("secondary button label meets 4.5:1", () => {
    expect(
      contrast("--ds-color-on-secondary", "--ds-color-secondary", vars),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("danger button label meets 4.5:1", () => {
    expect(contrast("--ds-color-on-status", "--ds-color-danger", vars)).toBeGreaterThanOrEqual(4.5);
  });

  it("default button label meets 4.5:1", () => {
    expect(contrast("--ds-color-text", "--ds-color-surface", vars)).toBeGreaterThanOrEqual(4.5);
  });

  it("body text on the page background meets 4.5:1", () => {
    expect(contrast("--ds-color-text", "--ds-color-background", vars)).toBeGreaterThanOrEqual(4.5);
  });

  it("secondary text on the page background meets 4.5:1", () => {
    expect(
      contrast("--ds-color-text-secondary", "--ds-color-background", vars),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
