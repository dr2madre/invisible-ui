#!/usr/bin/env node
// Generate the token registry the docs catalog reads: one entry per shipped
// `--ds-*` custom property, derived from the sources rather than retyped.
//
//   node scripts/generate-token-registry.mjs          # write the registry
//   node scripts/generate-token-registry.mjs --check  # fail if it is stale
//
// Sources, in order of authority:
//   1. packages/svelte/tokens/tokens.json  — the design-owned DTCG source
//   2. packages/svelte/src/lib/styles/tokens.css — the runtime theme that ships
//   3. the other three adapters' tokens.css — to record who exposes what
//   4. packages/docs/src/data/token-notes.json — the only hand-written part:
//      a role sentence and a stability label for tokens whose source comment
//      cannot say it
//
// The page never copies a colour into a specimen: the registry keeps the
// canonical expression (`var(--ds-neutral-200)`, `color-mix(...)`) and the page
// paints with the live custom property. The resolved value is worked out here,
// from the same stylesheet, and shown as text beside the specimen.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const rel = (path) => relative(root, path).split("\\").join("/");

const DTCG = resolve(root, "packages/svelte/tokens/tokens.json");
const SHEETS = {
  svelte: resolve(root, "packages/svelte/src/lib/styles/tokens.css"),
  vue: resolve(root, "packages/vue/src/styles/tokens.css"),
  react: resolve(root, "packages/react/src/styles/tokens.css"),
  elements: resolve(root, "packages/elements/src/styles/tokens.css"),
};
const NOTES = resolve(root, "packages/docs/src/data/token-notes.json");
const OUT = resolve(root, "packages/docs/src/generated/tokens/registry.json");

/** Which theme layer a declaration block represents. */
function layerOf(selector, atRules) {
  const inMedia = atRules.some((rule) => rule.includes("prefers-color-scheme: dark"));
  const inSupports = atRules.some((rule) => rule.startsWith("@supports"));
  if (inSupports)
    return inMedia || selector.includes('data-theme="dark"') ? "fallbackDark" : "fallbackLight";
  if (inMedia) return "darkMedia";
  if (selector.includes('data-theme="dark"')) return "darkAttr";
  if (selector.includes('data-theme="light"') || selector.trim() === ":root") return "light";
  return "other";
}

/**
 * Read every `--ds-*` declaration with the block it sits in, the line, and the
 * trailing comment that documents it. One stack, so nested at-rules and
 * selectors pop in the order they were opened.
 */
function parseSheet(css) {
  const found = [];
  const open = [];
  let line = 1;
  let buffer = "";
  let bufferStart = 1;
  let lastEnd = 0;
  // A comment describes only the run of declarations directly under it: the run
  // stops at a blank line, at the end of the block, or at the next comment.
  let group = null;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === "\n") line += 1;
    // Skip comments so a brace or semicolon inside one cannot confuse us.
    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const skipped = css.slice(i, end === -1 ? css.length : end + 2);
      const startedOn = line;
      line += (skipped.match(/\n/g) ?? []).length;
      const text = skipped
        .slice(2, -2)
        .split("\n")
        .map((row) => row.replace(/^\s*\*?\s?/, "").trim())
        .join(" ")
        .replace(/=+/g, "")
        .replace(/\s+/g, " ")
        .trim();
      // A comment on the same line as the declaration that just ended belongs
      // to that declaration: it says nothing about what follows, and it does
      // not interrupt the run the surrounding comment describes.
      if (startedOn !== lastEnd) group = text ? { text, nextLine: line + 1 } : null;
      i = end === -1 ? css.length : end + 1;
      continue;
    }
    if (char === "{") {
      const head = buffer.trim();
      buffer = "";
      group = null;
      open.push({ head, isAtRule: head.startsWith("@") });
      continue;
    }
    if (char === "}") {
      open.pop();
      buffer = "";
      group = null;
      continue;
    }
    if (char === ";") {
      const declaration = buffer.trim();
      const startLine = bufferStart;
      buffer = "";
      const match = /^(--ds-[\w-]+)\s*:\s*([\s\S]+)$/.exec(declaration);
      lastEnd = line;
      if (!match) {
        group = null;
        continue;
      }
      const inRun = group !== null && startLine === group.nextLine;
      if (group) group = inRun ? { text: group.text, nextLine: line + 1 } : null;
      const selectors = open.filter((block) => !block.isAtRule).map((block) => block.head);
      const atRules = open.filter((block) => block.isAtRule).map((block) => block.head);
      found.push({
        name: match[1],
        value: match[2].replace(/\s+/g, " ").trim(),
        selector: selectors[selectors.length - 1] ?? ":root",
        layer: layerOf(selectors[selectors.length - 1] ?? ":root", atRules),
        line: startLine,
        group: inRun ? group.text : null,
      });
      continue;
    }
    // Remember the line the declaration itself starts on, not the line the
    // previous one ended on.
    if (buffer.trim() === "" && char.trim() !== "") bufferStart = line;
    buffer += char;
  }
  return found;
}

/** The comment written after a declaration on the same line, if any. */
function commentsByLine(css) {
  const out = new Map();
  css.split("\n").forEach((text, index) => {
    const match = /--ds-[\w-]+\s*:[^;]*;\s*\/\*\s*([^*]+?)\s*\*\//.exec(text);
    if (!match) return;
    const note = match[1].replace(/\s+/g, " ").trim();
    // A note that is only a value (`#E5A1AC`) records the colour, not the job
    // the token does, so it must not be shown as the token's role.
    if (isJustAValue(note)) return;
    out.set(index + 1, note);
  });
  return out;
}

/** True for text that only restates a value: a hex, a length, a bare number. */
const isJustAValue = (text) =>
  /^(#[0-9a-fA-F]{3,8}|[\d.]+(px|rem|em|%)?|oklch\([^)]*\))$/.test(text.trim());

const TIERS = [
  { tier: "primitive", test: (n) => /^--ds-(neutral|purple|red|orange|green|blue)-\d+$/.test(n) },
  { tier: "primitive", test: (n) => n.startsWith("--ds-pastel-") },
  { tier: "brand", test: (n) => n.startsWith("--ds-brand-") },
  { tier: "feedback", test: (n) => n.startsWith("--ds-feedback-") },
  { tier: "semantic", test: (n) => n.startsWith("--ds-color-") },
  { tier: "state", test: (n) => n.startsWith("--ds-state-") },
  { tier: "focus", test: (n) => n.startsWith("--ds-focus-") },
  { tier: "radius", test: (n) => n.startsWith("--ds-radius-") },
  { tier: "elevation", test: (n) => n.startsWith("--ds-elevation-") },
  { tier: "typography", test: (n) => /^--ds-(font|line-height|heading)/.test(n) },
  { tier: "sizing", test: (n) => n.startsWith("--ds-control-") },
];
const tierOf = (name) => TIERS.find((entry) => entry.test(name))?.tier ?? "other";

/**
 * The CSS name a DTCG path ships as. `palette.grey.700` becomes
 * `--ds-neutral-700`, `style.primary.hover` becomes `--ds-brand-primary-hover`,
 * `style.danger.default` becomes `--ds-feedback-danger`.
 */
function cssNameForDtcg(path) {
  const parts = path.split(".");
  if (parts[0] === "palette") {
    const hue = parts[1] === "grey" ? "neutral" : parts[1];
    return `--ds-${hue}-${parts[2]}`;
  }
  if (parts[0] === "radius") return `--ds-radius-${parts[1]}`;
  if (parts[0] === "style") {
    const family = ["primary", "secondary", "white", "black"].includes(parts[1])
      ? "brand"
      : "feedback";
    const suffix = parts[2] === "default" ? "" : `-${parts[2]}`;
    return `--ds-${family}-${parts[1]}${suffix}`;
  }
  return null;
}

// Ownership is a fact about the sources, not a guess: a token is design-owned
// when the DTCG file defines it, and part of the theme layer when only the
// stylesheet does.
const ownershipOf = (inDtcg) => (inDtcg ? "design" : "frontend");

/**
 * What kind of value a token holds. A reference counts as a colour only if it
 * really resolves to one, so a future `--ds-motion-duration: var(--ds-x)` is
 * never painted as a swatch.
 */
function valueTypeOf(name, value, resolvesToColor) {
  if (/^--ds-(font-sans|font-mono)$/.test(name)) return "fontFamily";
  if (/^--ds-font-size|^--ds-line-height|^--ds-heading-weight/.test(name)) return "typography";
  if (name.startsWith("--ds-radius-") || name.startsWith("--ds-control-")) return "dimension";
  if (/^[\d.]+(px|rem|em|%)$/.test(value)) return "dimension";
  if (name.startsWith("--ds-elevation-") || name.endsWith("-shadow")) return "shadow";
  if (resolvesToColor) return "color";
  return "other";
}

/** The specimen shape the catalog draws this kind of value in. */
function specimenKindOf(name, valueType) {
  if (valueType === "color") return "color";
  if (name.startsWith("--ds-radius-")) return "radius";
  if (valueType === "shadow") return "shadow";
  if (valueType === "dimension") return "size";
  if (valueType === "fontFamily" || valueType === "typography") return "text";
  return null;
}

/** Follow `var(--x)` one hop at a time inside the same theme layer. */
function aliasChain(name, byName, layer, seen = new Set()) {
  if (seen.has(name)) return [`${name} (cycle)`];
  seen.add(name);
  const expression = byName.get(name)?.[layer] ?? byName.get(name)?.light;
  if (!expression) return [];
  const match = /^var\(\s*(--ds-[\w-]+)\s*(?:,[\s\S]*)?\)$/.exec(expression);
  if (!match) return [];
  return [match[1], ...aliasChain(match[1], byName, layer, seen)];
}

/** #rrggbb / #rgb to [r,g,b]. */
function hexToRgb(hex) {
  const value = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : hex;
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** oklch(L% C H) to sRGB, per CSS Color 4. */
function oklchToRgb(value) {
  const match = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(value);
  if (!match) return null;
  const L = Number(match[1]) / 100;
  const C = Number(match[2]);
  const h = (Number(match[3]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => {
    const srgb = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  });
}

/** Split a function's arguments on top-level commas. */
function splitArgs(inner) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of inner) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Resolve a color expression to sRGB by following `var()` inside one theme and
 * doing the `color-mix()` arithmetic. Returns null for anything that is not a
 * color, so the caller can tell "not a color" from "broken".
 */
function resolveColor(expression, lookup, seen = new Set()) {
  const value = (expression ?? "").trim();
  if (!value) return null;
  if (value === "transparent") return [0, 0, 0, 0];
  if (value.startsWith("#")) return [...hexToRgb(value), 1];
  if (value.startsWith("oklch(")) {
    const rgb = oklchToRgb(value);
    return rgb ? [...rgb, 1] : null;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] ? Number(rgb[4]) : 1];
  if (value.startsWith("var(")) {
    const args = splitArgs(value.slice(4, value.lastIndexOf(")")));
    const name = args[0];
    if (seen.has(name)) return null;
    seen.add(name);
    const next = lookup(name);
    if (next != null) return resolveColor(next, lookup, seen);
    return args[1] ? resolveColor(args[1], lookup, seen) : null;
  }
  if (value.startsWith("color-mix(")) {
    const args = splitArgs(value.slice(10, value.lastIndexOf(")")));
    if (args[0] !== "in srgb" && !args[0].startsWith("in srgb")) return null;
    const readStop = (stop) => {
      const percent = /([\d.]+)%\s*$/.exec(stop);
      const color = percent ? stop.slice(0, percent.index).trim() : stop;
      return {
        color: resolveColor(color, lookup, new Set(seen)),
        weight: percent ? Number(percent[1]) : null,
      };
    };
    const first = readStop(args[1] ?? "");
    const second = readStop(args[2] ?? "");
    if (!first.color || !second.color) return null;
    const a = first.weight ?? (second.weight != null ? 100 - second.weight : 50);
    const b = second.weight ?? 100 - a;
    const total = a + b || 100;
    const alpha = (first.color[3] * a + second.color[3] * b) / total;
    if (alpha === 0) return [0, 0, 0, 0];
    const channel = (i) =>
      Math.round(
        (first.color[i] * first.color[3] * a + second.color[i] * second.color[3] * b) /
          total /
          alpha,
      );
    return [channel(0), channel(1), channel(2), Math.round(alpha * 1000) / 1000];
  }
  return null;
}

const toHex = (rgb) =>
  `#${rgb
    .slice(0, 3)
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** How the catalog shows a resolved value: hex, or hex plus its alpha. */
const formatColor = (rgb) =>
  rgb[3] === 1 ? toHex(rgb) : `${toHex(rgb)} at ${Math.round(rgb[3] * 100)}% alpha`;

// Takes the three colour channels only: a colour carries a fourth (alpha) that
// must not enter the sum.
const luminance = ([red, green, blue]) =>
  [red, green, blue]
    .map((channel) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

// Contrast is only defined between two opaque colours: an overlay has to be
// composited first, so we report nothing rather than a wrong number.
function contrast(a, b) {
  if (a[3] !== 1 || b[3] !== 1) return null;
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

// The pairs the components actually put on top of each other. `min` is the
// success criterion that applies: 4.5 for normal text (1.4.3), 3 for a
// boundary or a glyph (1.4.11).
const PAIRINGS = [
  {
    front: "--ds-color-text",
    back: "--ds-color-background",
    min: 4.5,
    what: "body text on the page",
  },
  {
    front: "--ds-color-text",
    back: "--ds-color-surface",
    min: 4.5,
    what: "body text on a surface",
  },
  {
    front: "--ds-color-text-secondary",
    back: "--ds-color-background",
    min: 4.5,
    what: "supporting text on the page",
  },
  {
    front: "--ds-color-text-secondary",
    back: "--ds-color-surface",
    min: 4.5,
    what: "supporting text on a surface",
  },
  {
    front: "--ds-color-on-primary",
    back: "--ds-color-primary",
    min: 4.5,
    what: "primary button label",
  },
  {
    front: "--ds-color-on-primary",
    back: "--ds-color-primary-hover",
    min: 4.5,
    what: "primary button label, hovered",
  },
  {
    front: "--ds-color-on-secondary",
    back: "--ds-color-secondary",
    min: 4.5,
    what: "secondary button label",
  },
  {
    front: "--ds-color-on-status",
    back: "--ds-color-danger",
    min: 4.5,
    what: "danger button label",
  },
  {
    front: "--ds-color-on-status",
    back: "--ds-color-info",
    min: 4.5,
    what: "label on the information fill",
  },
  {
    front: "--ds-color-on-status",
    back: "--ds-color-success",
    min: 4.5,
    what: "label on the success fill",
  },
  {
    front: "--ds-color-on-warning",
    back: "--ds-color-warning",
    min: 3,
    what: "the icon on the warning fill",
  },
  {
    front: "--ds-color-on-selected",
    back: "--ds-color-selected",
    min: 4.5,
    what: "label on a selected item",
  },
  {
    front: "--ds-color-on-emphasis",
    back: "--ds-color-emphasis-surface",
    min: 4.5,
    what: "text on the emphasis surface",
  },
  {
    front: "--ds-color-on-secondary-surface",
    back: "--ds-color-secondary-surface",
    min: 4.5,
    what: "label on the secondary action fill",
  },
  {
    front: "--ds-color-on-destructive-surface",
    back: "--ds-color-destructive-surface",
    min: 4.5,
    what: "label on the destructive action fill",
  },
  {
    front: "--ds-color-info-text",
    back: "--ds-color-info-surface",
    min: 4.5,
    what: "information text on its tinted surface",
  },
  {
    front: "--ds-color-success-text",
    back: "--ds-color-success-surface",
    min: 4.5,
    what: "success text on its tinted surface",
  },
  {
    front: "--ds-color-warning-text",
    back: "--ds-color-warning-surface",
    min: 4.5,
    what: "warning text on its tinted surface",
  },
  {
    front: "--ds-color-danger-text",
    back: "--ds-color-danger-surface",
    min: 4.5,
    what: "danger text on its tinted surface",
  },
  {
    front: "--ds-color-neutral-text",
    back: "--ds-color-neutral-surface",
    min: 4.5,
    what: "text on the quiet neutral fill",
  },
  {
    front: "--ds-color-secondary-body-text",
    back: "--ds-color-background",
    min: 4.5,
    what: "brand-coloured text on the page",
  },
  {
    front: "--ds-color-danger-body-text",
    back: "--ds-color-background",
    min: 4.5,
    what: "danger-coloured text on the page",
  },
  {
    front: "--ds-color-success-body-text",
    back: "--ds-color-background",
    min: 4.5,
    what: "success-coloured text on the page",
  },
  {
    front: "--ds-color-control-border",
    back: "--ds-color-background",
    min: 3,
    what: "a control's boundary against the page",
  },
  {
    front: "--ds-color-control-border",
    back: "--ds-color-surface",
    min: 3,
    what: "a control's boundary against a surface",
  },
  {
    front: "--ds-color-focus-ring",
    back: "--ds-color-background",
    min: 3,
    what: "the focus ring against the page",
  },
  {
    front: "--ds-color-focus-ring",
    back: "--ds-color-surface",
    min: 3,
    what: "the focus ring against a surface",
  },
];

// Pages that document token values literally. A line there must say what the
// stylesheet says, or the docs are quietly wrong. Put `/* example */` after a
// declaration that is deliberately a made-up override.
const REFERENCE_PAGES = [
  "packages/docs/src/content/docs/presentation/tokens.mdx",
  "packages/docs/src/content/docs/presentation/color-palette.mdx",
  "packages/docs/src/content/docs/presentation/token-catalog.mdx",
];
const CATALOG_COMPONENT = "packages/docs/src/components/TokenCatalog.astro";
// The specimen rules live in their own module so this check can be exact: the
// component's own chrome may name a fallback colour, a specimen may not.
const SPECIMEN_MODULE = "packages/docs/src/lib/token-specimens.ts";

/**
 * Everything that has to stay true between the sources, the registry and the
 * catalog. Returns a list of problems; an empty list is the passing state.
 */
function gates(registry, byName, adapters, notes, dtcgPaths) {
  const problems = [];
  const known = new Set(registry.tokens.map((token) => token.name));

  // 1. The four adapters must expose exactly the same set of names.
  const sets = Object.entries(adapters);
  const reference = sets[0];
  for (const [adapter, names] of sets.slice(1)) {
    for (const name of reference[1]) {
      if (!names.has(name))
        problems.push(`${name} is in ${reference[0]} but missing from ${adapter}`);
    }
    for (const name of names) {
      if (!reference[1].has(name))
        problems.push(`${name} is in ${adapter} but missing from ${reference[0]}`);
    }
  }

  // 1b. The copies must be identical, so the values the catalog publishes are
  // the values every adapter ships.
  for (const [adapter, file] of Object.entries(SHEETS)) {
    if (adapter === "svelte") continue;
    if (readFileSync(file, "utf8") !== readFileSync(SHEETS.svelte, "utf8")) {
      problems.push(
        `${rel(file)} is not identical to the Svelte copy, so the catalog would publish one adapter's values as everyone's`,
      );
    }
  }

  // 2. Every reference must land on a token that exists, and never on itself.
  // This covers references buried inside color-mix() and box-shadow, in every
  // layer, not just aliases that are the whole value.
  for (const token of registry.tokens) {
    for (const step of token.aliasChain) {
      if (step.endsWith("(cycle)")) problems.push(`${token.name} alias chain loops at ${step}`);
    }
    for (const [layer, expression] of Object.entries(token.expressions)) {
      if (!expression) continue;
      for (const [, referenced] of expression.matchAll(/var\(\s*(--ds-[\w-]+)/g)) {
        if (referenced === token.name) {
          problems.push(`${token.name} refers to itself in the ${layer} layer`);
        } else if (!known.has(referenced)) {
          problems.push(
            `${token.name} refers to ${referenced} in the ${layer} layer, which nothing defines`,
          );
        }
      }
    }
  }

  // 2b. Every token in the design source must ship as a CSS token, or the two
  // have quietly diverged.
  for (const path of dtcgPaths) {
    const name = cssNameForDtcg(path);
    if (!name) problems.push(`the design source defines ${path}, which maps to no CSS name`);
    else if (!known.has(name)) {
      problems.push(`the design source defines ${path}, but ${name} is not in the stylesheet`);
    }
  }

  // 3. Every token needs a role a reader can understand, not just its tier.
  for (const token of registry.tokens) {
    const description = token.purpose ?? token.group;
    if (!description || /^Tier \d/.test(description) || isJustAValue(description)) {
      problems.push(`${token.name} has no role description (add one to token-notes.json)`);
    }
  }

  // 4. Every colour must resolve in both themes, or the catalog cannot show it.
  for (const token of registry.tokens) {
    if (token.valueType !== "color") continue;
    for (const theme of ["light", "dark"]) {
      if (!token.resolved[theme]) problems.push(`${token.name} does not resolve in ${theme}`);
    }
  }

  // 4b. Every published pair must name real tokens and produce a number, or the
  // table would report a failure that is really a missing measurement.
  for (const pair of registry.pairings) {
    for (const side of [pair.front, pair.back]) {
      if (!known.has(side))
        problems.push(`the pair "${pair.what}" names ${side}, which nothing defines`);
    }
    for (const theme of ["light", "dark"]) {
      if (pair[theme] == null)
        problems.push(`the pair "${pair.what}" could not be measured in ${theme}`);
    }
  }

  // 4b2. A published pair below its minimum fails the build. The catalog's
  // "meets/below" words are reporting; this is the gate behind them.
  for (const pair of registry.pairings) {
    for (const theme of ["light", "dark"]) {
      if (pair.passes[theme] === false) {
        problems.push(
          `the pair "${pair.what}" measures ${pair[theme]}:1 in ${theme}, below its ${pair.min}:1 minimum`,
        );
      }
    }
  }

  // 4c. A deprecated alias must name a real replacement and must actually
  // resolve to it, or the deprecation notice would lie.
  for (const token of registry.tokens) {
    if (token.stability === "deprecated" && !token.replacedBy) {
      problems.push(`${token.name} is deprecated but names no replacement`);
    }
    if (token.replacedBy) {
      if (!known.has(token.replacedBy)) {
        problems.push(
          `${token.name} says it is replaced by ${token.replacedBy}, which nothing defines`,
        );
      } else if (token.expressions.light !== `var(${token.replacedBy})`) {
        problems.push(`${token.name} does not resolve to its replacement ${token.replacedBy}`);
      }
    }
  }

  // 5. Hand-written notes must not describe tokens that no longer exist.
  for (const name of Object.keys(notes)) {
    if (name.startsWith("$")) continue;
    if (!known.has(name))
      problems.push(`token-notes.json describes ${name}, which no longer exists`);
  }

  // 6. Values quoted on the reference pages must match the stylesheet, whether
  // they are written as a declaration or inside a table cell.
  const normalize = (value) => value.replace(/\s+/g, "").toLowerCase();
  for (const page of REFERENCE_PAGES) {
    const file = resolve(root, page);
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    let inFence = false;
    let isExample = false;
    lines.forEach((line, index) => {
      if (line.trimStart().startsWith("```")) {
        inFence = !inFence;
        isExample = false;
        return;
      }
      if (line.includes("/* example */") || line.includes("<!-- example -->")) {
        // Marks the rest of this block as a made-up override, not a quote.
        isExample = true;
        return;
      }
      if (isExample) return;
      const named = /(--ds-[\w-]+)/.exec(line);
      if (!named || !known.has(named[1])) return;
      const entry = byName.get(named[1]);
      const actual = [entry.light, entry.darkAttr, entry.darkMedia, entry.other]
        .filter(Boolean)
        .map(normalize);
      const declared = /--ds-[\w-]+:\s*([^;]+);/.exec(line);
      // A declaration quotes the whole value; a table cell or a sentence quotes
      // a bare literal, which still has to be one of the token's values.
      const quoted = declared
        ? [declared[1]]
        : (line.match(/#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em)\b/g) ?? []);
      for (const value of quoted) {
        if (!actual.includes(normalize(value))) {
          problems.push(
            `${page}:${index + 1} says ${named[1]} is "${value.trim()}", the stylesheet says "${entry.light ?? entry.other}"`,
          );
        }
      }
    });
  }

  // 7. The catalog must paint with the live token, never with a copied value.
  // That covers the specimen rules and the page's own chrome: the docs site
  // loads tokens.css, so a `var(--x, #fff)` fallback is only a chance to drift,
  // and one of them already had drifted.
  for (const file of [SPECIMEN_MODULE, CATALOG_COMPONENT]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8").replace(/^\s*\/\/.*$/gm, "");
    const fallback = /var\(\s*--ds-[\w-]+\s*,/.exec(source);
    if (fallback) problems.push(`${file} gives a token a hard-coded fallback: ${fallback[0]}`);
    const literal = /(#[0-9a-fA-F]{3,8}\b|\boklch\(|\brgba?\()/.exec(source);
    if (literal) problems.push(`${file} contains the copied value ${literal[0]}`);
  }

  // 8. Every token must land in a kind the catalog knows how to show.
  for (const token of registry.tokens) {
    if (token.valueType === "other") {
      problems.push(`${token.name} has no value type, so the catalog cannot show it`);
    }
  }

  // 8b. The two hand-written dark blocks (system scheme and forced attribute)
  // must agree: a token present in only one of them, or with two different
  // values, means the two ways of being dark render differently.
  const squeeze = (value) =>
    (value ?? "").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
  for (const [name, entry] of byName) {
    const media = entry.darkMedia;
    const attr = entry.darkAttr;
    if (media == null && attr == null) continue;
    if (media == null || attr == null) {
      problems.push(
        `${name} has a dark value in only one dark block (${media == null ? "attribute" : "media"} only)`,
      );
    } else if (squeeze(media) !== squeeze(attr)) {
      problems.push(`${name} differs between the two dark blocks`);
    }
  }

  // 9. Two declarations of one token in one layer must at least agree.
  for (const [name, entry] of byName) {
    for (const [layer, values] of Object.entries(entry.__collisions ?? {})) {
      if (new Set(values).size > 1) {
        problems.push(
          `${name} is declared ${values.length} times in the ${layer} layer with different values`,
        );
      }
    }
  }

  // 10. Every token the catalog lists must have a specimen shape to show it in.
  const catalog = resolve(root, CATALOG_COMPONENT);
  if (existsSync(catalog) && !readFileSync(catalog, "utf8").includes("specimenCss")) {
    problems.push(`${CATALOG_COMPONENT} does not use the generated specimen rules`);
  }

  return problems;
}

function build() {
  const dtcgRaw = JSON.parse(readFileSync(DTCG, "utf8"));
  const dtcgNames = new Set();
  const walkDtcg = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      if (value && typeof value === "object" && "$value" in value)
        dtcgNames.add([...path, key].join("."));
      else if (value && typeof value === "object") walkDtcg(value, [...path, key]);
    }
  };
  walkDtcg(dtcgRaw, []);

  const svelteCss = readFileSync(SHEETS.svelte, "utf8");
  const declarations = parseSheet(svelteCss);
  const comments = commentsByLine(svelteCss);

  const byName = new Map();
  for (const declaration of declarations) {
    const entry = byName.get(declaration.name) ?? {};
    // Two declarations of the same token in the same layer have the same
    // weight, so the later one is the one that applies. Keep every value seen
    // so a real disagreement can be reported instead of quietly dropped.
    entry.__collisions = entry.__collisions ?? {};
    entry.__collisions[declaration.layer] = entry.__collisions[declaration.layer] ?? [];
    entry.__collisions[declaration.layer].push(declaration.value);
    entry[declaration.layer] = declaration.value;
    if (!entry.__line) entry.__line = declaration.line;
    if (!entry.__comment && comments.has(declaration.line))
      entry.__comment = comments.get(declaration.line);
    if (!entry.__group && declaration.group) entry.__group = declaration.group;
    byName.set(declaration.name, entry);
  }

  const adapters = {};
  for (const [adapter, file] of Object.entries(SHEETS)) {
    adapters[adapter] = new Set(parseSheet(readFileSync(file, "utf8")).map((d) => d.name));
  }

  const notes = existsSync(NOTES) ? JSON.parse(readFileSync(NOTES, "utf8")) : {};

  // One lookup per theme: dark falls back through the attribute block, the
  // media block, then the light value, which is what the cascade does.
  const lookup = (theme) => (name) => {
    const entry = byName.get(name);
    if (!entry) return null;
    if (theme === "dark")
      return entry.darkAttr ?? entry.darkMedia ?? entry.light ?? entry.other ?? null;
    return entry.light ?? entry.other ?? null;
  };
  const resolveIn = (theme, name) => {
    const rgb = resolveColor(lookup(theme)(name), lookup(theme));
    return rgb ? formatColor(rgb) : null;
  };

  const tokens = [...byName.keys()].sort().map((name) => {
    const entry = byName.get(name);
    const tier = tierOf(name);
    // A DTCG name maps to CSS by its own convention: palette.grey.N ships as
    // --ds-neutral-N, style.x.y as --ds-brand-*/--ds-feedback-*.
    const dtcgPath = [...dtcgNames].find((path) => cssNameForDtcg(path) === name) ?? null;
    const note = notes[name] ?? {};
    const light = resolveIn("light", name);
    const dark = resolveIn("dark", name);
    const valueType = valueTypeOf(name, entry.light ?? entry.other ?? "", Boolean(light));
    return {
      name,
      id: name.replace(/^--ds-/, ""),
      tier,
      ownership: ownershipOf(Boolean(dtcgPath)),
      valueType,
      specimenKind: specimenKindOf(name, valueType),
      source: { file: rel(SHEETS.svelte), line: entry.__line, dtcg: dtcgPath },
      expressions: {
        light: entry.light ?? entry.other ?? null,
        darkMedia: entry.darkMedia ?? null,
        darkAttr: entry.darkAttr ?? null,
        fallbackLight: entry.fallbackLight ?? null,
        fallbackDark: entry.fallbackDark ?? null,
      },
      aliasChain: aliasChain(name, byName, "light"),
      adapters: Object.entries(adapters)
        .filter(([, names]) => names.has(name))
        .map(([adapter]) => adapter),
      resolved: { light, dark },
      hasAlpha: [light, dark].some((value) => value?.includes("alpha")),
      purpose: note.purpose ?? entry.__comment ?? null,
      group: entry.__group ?? null,
      stability: note.stability ?? "alpha",
      replacedBy: note.replacedBy ?? null,
    };
  });

  const pairings = PAIRINGS.map((pair) => {
    const measure = (theme) => {
      const front = resolveColor(lookup(theme)(pair.front), lookup(theme));
      const back = resolveColor(lookup(theme)(pair.back), lookup(theme));
      if (!front || !back) return null;
      const ratio = contrast(front, back);
      return ratio == null ? null : Math.round(ratio * 100) / 100;
    };
    const light = measure("light");
    const dark = measure("dark");
    return {
      ...pair,
      light,
      dark,
      passes: {
        light: light == null ? null : light >= pair.min,
        dark: dark == null ? null : dark >= pair.min,
      },
    };
  });

  return {
    // No timestamp: the registry must be reproducible so --check is meaningful.
    tokens,
    pairings,
    counts: {
      total: tokens.length,
      byTier: tokens.reduce((acc, token) => {
        acc[token.tier] = (acc[token.tier] ?? 0) + 1;
        return acc;
      }, {}),
      withDarkOverride: tokens.filter((t) => t.expressions.darkAttr || t.expressions.darkMedia)
        .length,
      designOwned: tokens.filter((t) => t.ownership === "design").length,
      colors: tokens.filter((t) => t.valueType === "color").length,
    },
    adapters: Object.fromEntries(Object.entries(adapters).map(([name, set]) => [name, set.size])),
    __sources: { byName, adapters, notes, dtcgPaths: [...dtcgNames] },
  };
}

const registry = build();
const { byName, adapters, notes, dtcgPaths } = registry.__sources;
delete registry.__sources;

const problems = gates(registry, byName, adapters, notes, dtcgPaths);
if (problems.length > 0) {
  console.error(`Token drift (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const serialized = `${JSON.stringify(registry, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== serialized) {
    console.error("Stale token registry (run `pnpm tokens:registry`).");
    process.exit(1);
  }
  console.log(`Token registry up to date (${registry.counts.total} tokens).`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, serialized);
  console.log(`Wrote ${rel(OUT)} (${registry.counts.total} tokens).`);
}
