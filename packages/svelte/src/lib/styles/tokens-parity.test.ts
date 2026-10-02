// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards that the DTCG source (packages/tokens/tokens.json, the design-owned
// single source) stays in sync with the runtime stylesheet (tokens.css). Every
// token in the source must equal the value the stylesheet resolves to, in the
// theme it belongs to.

type TokenValue = string | number | { components: number[]; alpha?: number; hex: string };
type TokenNode = { $value?: TokenValue; $type?: string } & {
  [key: string]: TokenNode | TokenValue | undefined;
};

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const tokens = JSON.parse(read("../../../../tokens/tokens.json")) as TokenNode;
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
    if (next === undefined || typeof next !== "object" || Array.isArray(next) || "hex" in next)
      throw new Error(`no token at ${path}`);
    node = next as TokenNode;
  }
  return node;
};

/** Resolve a token's `$value`, following `{group.token}` aliases. */
const resolve = (value: TokenValue): TokenValue => {
  const alias = typeof value === "string" ? /^\{(.+)\}$/.exec(value) : null;
  return alias ? resolve(walk(alias[1]!).$value!) : value;
};
const val = (path: string) => String(resolve(walk(path).$value!)).toLowerCase();

/** The token names (no `$` keys) directly under a group. */
const keysOf = (path: string) => Object.keys(walk(path)).filter((key) => !key.startsWith("$"));

// ---------------------------------------------------------------------------
// The stylesheet, by theme. Light reads the light block, then the plain
// `:root` blocks; dark reads `[data-theme="dark"]` first. The system-scheme
// dark block must equal the attribute one, which the role test checks.

const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Top-level `selector { body }` pairs. */
const blocks = (text: string) => {
  const out: { selector: string; body: string }[] = [];
  let depth = 0;
  let from = 0;
  let open = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" && depth++ === 0) open = i;
    if (text[i] === "}" && --depth === 0) {
      out.push({ selector: text.slice(from, open).trim(), body: text.slice(open + 1, i) });
      from = i + 1;
    }
  }
  return out;
};
const declarations = (body: string) =>
  new Map(
    [...body.matchAll(/(--ds-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1]!,
      m[2]!.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim(),
    ]),
  );

const top = blocks(stripped);
const rootDecls = new Map(
  top.filter((b) => b.selector === ":root").flatMap((b) => [...declarations(b.body)]),
);
const lightDecls = declarations(top.find((b) => b.selector.startsWith(":root,"))!.body);
const darkDecls = declarations(top.find((b) => b.selector === '[data-theme="dark"]')!.body);
const darkMediaDecls = declarations(
  blocks(top.find((b) => b.selector === "@media (prefers-color-scheme: dark)")!.body)[0]!.body,
);

type Mode = "light" | "dark";
const lookup = (mode: Mode, name: string) =>
  (mode === "dark" ? darkDecls.get(name) : undefined) ??
  lightDecls.get(name) ??
  rootDecls.get(name);

type Rgba = { c: number[]; a: number };
const fromHex = (hex: string): number[] =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** What a colour expression works out to, channels 0 to 255, unrounded. */
const color = (mode: Mode, expression: string): Rgba => {
  const value = expression.trim();
  if (value === "transparent") return { c: [0, 0, 0], a: 0 };
  if (value.startsWith("#")) return { c: fromHex(value), a: 1 };
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value);
  if (rgb) return { c: [1, 2, 3].map((i) => Number(rgb[i])), a: Number(rgb[4]) };
  const ref = /^var\((--ds-[\w-]+)(?:, (.+))?\)$/.exec(value);
  if (ref) return color(mode, lookup(mode, ref[1]!) ?? ref[2]!);
  const mix = /^color-mix\(in srgb, (.+) (\d+)%, (.+)\)$/.exec(value);
  if (mix) {
    const p = Number(mix[2]);
    const first = color(mode, mix[1]!);
    const second = color(mode, mix[3]!);
    const a = (first.a * p + second.a * (100 - p)) / 100;
    const c = first.c.map(
      (x, i) => (x * first.a * p + second.c[i]! * second.a * (100 - p)) / 100 / a,
    );
    return { c, a };
  }
  throw new Error(`cannot resolve ${value}`);
};
const hexOf = (c: number[]) =>
  `#${c.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;

/** A DTCG colour, resolved through aliases, as the same `Rgba` shape. */
const tokenColor = (path: string): Rgba => {
  const value = resolve(walk(path).$value!);
  if (typeof value === "string") return { c: fromHex(value), a: 1 };
  if (typeof value === "number") throw new Error(`${path} is not a colour`);
  // The object form keeps an exact alpha; its hex must agree with its channels.
  expect(value.components.map((x) => Math.round(x * 255))).toEqual(fromHex(value.hex));
  return { c: fromHex(value.hex), a: value.alpha ?? 1 };
};

/** The $extensions key that holds a mixed colour's recipe. */
const MIX = "com.invisible-ui.mix";

// Composite or theme-only values the role tier leaves to the stylesheet.
const NOT_IN_ROLE_TIER = new Set([
  "--ds-focus-ring-shadow", // built from the focus tokens below
  "--ds-elevation-overlay", // a shadow, not a colour role
  "--ds-color-focus-ring-on-dark", // style.focus.onDark
  "--ds-focus-ring-width", // focus.*
  "--ds-focus-ring-offset",
  "--ds-focus-halo-width",
]);

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

  it("style.focus.onDark matches the dark --ds-color-focus-ring mix", () => {
    // tokens.css mixes it at runtime; the mix recipe test below recomputes it.
    // The light block also carries it as one fixed value.
    expect(darkDecls.get("--ds-color-focus-ring")).toBe(
      "color-mix(in srgb, var(--ds-brand-secondary) 70%, var(--ds-neutral-0))",
    );
    expect(val("style.focus.onDark")).toBe(cssVar("color-focus-ring-on-dark"));
  });

  it("palette.grey.* matches the --ds-neutral-* ramp", () => {
    for (const weight of keysOf("palette.grey")) {
      expect(val(`palette.grey.${weight}`)).toBe(cssVar(`neutral-${weight}`));
    }
  });

  it("radius.* matches --ds-radius-*", () => {
    expect(val("radius.control")).toBe(cssVar("radius-control"));
    expect(val("radius.surface")).toBe(cssVar("radius-surface"));
    expect(val("radius.pill")).toBe(cssVar("radius-pill"));
  });

  it("the system-scheme dark block equals the [data-theme=dark] block", () => {
    expect(Object.fromEntries(darkMediaDecls)).toEqual(Object.fromEntries(darkDecls));
  });

  it.each(["light", "dark"] as const)("role.%s.* matches that theme in the stylesheet", (mode) => {
    for (const key of keysOf(`role.${mode}`)) {
      const expression = lookup(mode, `--ds-${key}`);
      expect(expression, `--ds-${key}`).toBeDefined();
      const expected = color(mode, expression!);
      const actual = tokenColor(`role.${mode}.${key}`);
      expect(hexOf(actual.c), `role.${mode}.${key}`).toBe(hexOf(expected.c));
      expect(actual.a, `role.${mode}.${key} alpha`).toBe(expected.a);
    }
  });

  it.each(["light", "dark"] as const)(
    "every colour role of the %s theme has a role token",
    (mode) => {
      const declared = [...lightDecls.keys(), ...(mode === "dark" ? darkDecls.keys() : [])];
      const roles = new Set(keysOf(`role.${mode}`).map((key) => `--ds-${key}`));
      for (const name of new Set(declared)) {
        if (!NOT_IN_ROLE_TIER.has(name)) expect(roles.has(name), name).toBe(true);
      }
      expect(roles.has("--ds-color-selected")).toBe(true);
      expect(roles.has("--ds-color-on-selected")).toBe(true);
    },
  );

  it("focus.* matches --ds-focus-*", () => {
    for (const key of keysOf("focus")) expect(val(`focus.${key}`)).toBe(cssVar(`focus-${key}`));
  });

  it("typography.* matches the type scale", () => {
    const keys = keysOf("typography");
    expect(keys).toHaveLength(9);
    for (const key of keys) expect(val(`typography.${key}`)).toBe(cssVar(key));
  });

  it("density.regular matches the stylesheet; target sizes follow ADR 0017", () => {
    for (const key of keysOf("density.regular")) {
      expect(val(`density.regular.${key}`)).toBe(cssVar(key));
    }
    expect(val("density.regular.min-target-size")).toBe("24px");
    expect(val("density.compact.min-target-size")).toBe("24px");
    expect(val("density.touch.min-target-size")).toBe("44px");
    // The stylesheet renders the regular level only: one declaration, no
    // per-density selector.
    expect(stripped.match(/--ds-min-target-size\s*:/g)).toHaveLength(1);
    expect(stripped).not.toMatch(/data-density/);
  });

  // A mixed role keeps the resolved colour in $value and the mix it comes
  // from under $extensions, so a platform without color-mix() can recompute a
  // tint after overriding a brand or feedback colour.
  describe("mix recipes", () => {
    type Recipe = { space: string; base: string; amount: number; with: string };
    type Mixed = { path: string; recipe: Recipe; css: string; mode: Mode };

    const mixed: Mixed[] = [];
    const collect = (node: TokenNode, path: string[]) => {
      for (const [key, child] of Object.entries(node)) {
        if (key.startsWith("$") || !child || typeof child !== "object") continue;
        const token = child as TokenNode & { $extensions?: Record<string, unknown> };
        if (!("$value" in token)) {
          collect(token, [...path, key]);
          continue;
        }
        const recipe = token.$extensions?.[MIX] as Recipe | undefined;
        if (!recipe) continue;
        const at = [...path, key].join(".");
        const mode: Mode = path[1] === "light" ? "light" : "dark";
        const css =
          at === "style.focus.onDark"
            ? darkDecls.get("--ds-color-focus-ring")!
            : lookup(mode, `--ds-${key}`)!;
        mixed.push({ path: at, recipe, css, mode });
      }
    };
    collect(tokens, []);

    /** A recipe colour: a token reference, a hex, or `transparent`. */
    const operand = (value: string): Rgba => {
      if (value === "transparent") return { c: [0, 0, 0], a: 0 };
      const alias = /^\{(.+)\}$/.exec(value);
      return alias ? tokenColor(alias[1]!) : { c: fromHex(value), a: 1 };
    };

    /** The token reference a stylesheet operand stands for, in a theme. */
    const asRecipeOperand = (mode: Mode, value: string): string => {
      const name = /^var\(--ds-([\w-]+)\)$/.exec(value)?.[1];
      if (!name) return value;
      const grey = /^neutral-(\d+)$/.exec(name);
      if (grey) return `{palette.grey.${grey[1]}}`;
      const style = /^(?:brand|feedback)-([a-z]+)(-hover)?$/.exec(name);
      if (style) return `{style.${style[1]}.${style[2] ? "hover" : "default"}}`;
      return `{role.${mode}.${name}}`;
    };

    it("covers every color-mix() role and style.focus.onDark", () => {
      const expected = (["light", "dark"] as const).flatMap((mode) =>
        keysOf(`role.${mode}`)
          .filter((key) => lookup(mode, `--ds-${key}`)?.startsWith("color-mix("))
          // The dark ring is a reference to style.focus.onDark, which holds the mix.
          .filter((key) => !String(walk(`role.${mode}.${key}`).$value).startsWith("{"))
          .map((key) => `role.${mode}.${key}`),
      );
      expect(mixed.map((entry) => entry.path).sort()).toEqual(
        [...expected, "style.focus.onDark"].sort(),
      );
    });

    it("each recipe is the mix tokens.css writes", () => {
      for (const { path, recipe, css: expression, mode } of mixed) {
        const mix = /^color-mix\(in ([a-z]+), (.+) (\d+)%, (.+)\)$/.exec(expression);
        expect(mix, path).not.toBeNull();
        expect(recipe, path).toEqual({
          space: mix![1],
          base: asRecipeOperand(mode, mix![2]!),
          amount: Number(mix![3]) / 100,
          with: asRecipeOperand(mode, mix![4]!),
        });
      }
    });

    it("each recipe recomputes to its $value and to the stylesheet", () => {
      for (const { path, recipe, css: expression, mode } of mixed) {
        expect(recipe.space, path).toBe("srgb");
        const base = operand(recipe.base);
        const other = operand(recipe.with);
        const p = recipe.amount;
        // sRGB mixing with premultiplied alpha, as color-mix() does.
        const a = base.a * p + other.a * (1 - p);
        const c = base.c.map((x, i) => (x * base.a * p + other.c[i]! * other.a * (1 - p)) / a);
        const value = tokenColor(path);
        expect(hexOf(c), `${path} $value`).toBe(hexOf(value.c));
        expect(Math.round(a * 1000) / 1000, `${path} alpha`).toBe(value.a);
        expect(hexOf(c), `${path} in tokens.css`).toBe(hexOf(color(mode, expression).c));
      }
    });
  });
});
