import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { generate } from "./generate-figma-tokens.mjs";
import { cssName, resolveTokens, tokenEntries } from "./token-model.mjs";
import { readButtonAppearance } from "./capture-figma-button.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../packages/svelte/package.json", import.meta.url));
const { parse } = require("svelte/compiler");
const sourcePath = resolve(root, "packages/svelte/src/lib/card/Card.svelte");
const outputPath = resolve(root, "tools/figma-component-pilot/code.js");
const buttonPath = resolve(root, "packages/svelte/src/lib/button/Button.svelte");

function unsupported(detail) {
  throw new Error(`Figma Card export: ${detail}. Update the CSS adapter before generating.`);
}

function dimension(value) {
  const fallback = /^var\(--[\w-]+,\s*(.+)\)$/.exec(value)?.[1] ?? value;
  const match = /^(\d+(?:\.\d+)?|\.\d+)(rem|px)$/.exec(fallback);
  if (!match) unsupported(`unsupported dimension ${value}`);
  return Number(match[1]) * (match[2] === "rem" ? 16 : 1);
}

function mapped(value, options) {
  if (!Object.hasOwn(options, value)) unsupported(`unsupported layout value ${value}`);
  return options[value];
}

// This adapter handles the Card media layout, not the general CSS cascade.
export function extractCardLayout(source) {
  const css = parse(source).css;
  if (!css) unsupported("missing Card styles");
  const rules = new Map();
  for (const rule of css.children) {
    if (rule.type !== "Rule") continue;
    const selector = source.slice(rule.prelude.start, rule.prelude.end).trim();
    const declarations = rules.get(selector) ?? {};
    for (const declaration of rule.block.children) {
      if (declaration.type === "Declaration") {
        declarations[declaration.property] = declaration.value;
      }
    }
    rules.set(selector, declarations);
  }
  const rule = (selector) => {
    if (!rules.has(selector)) unsupported(`missing selector ${selector}`);
    return rules.get(selector);
  };
  const vertical = rule(".card--media");
  const horizontal = { ...vertical, ...rule('.card--media[data-orientation="horizontal"]') };
  const media = rule(".card__media");
  const sideMedia = {
    ...media,
    ...rule('.card--media[data-orientation="horizontal"] .card__media'),
  };
  const body = rule(".card__body");
  if (vertical.display !== "flex" || horizontal.display !== "flex" || media.display !== "flex") {
    unsupported("Card media layout must use flex");
  }
  if (media.flex !== "none") unsupported(`media flex ${media.flex}`);
  if (media["inline-size"] || media["block-size"]) unsupported("explicit base media size");
  const direction = { column: "VERTICAL", row: "HORIZONTAL" };
  const alignment = { center: "CENTER", "flex-start": "MIN", "flex-end": "MAX" };
  const stretch = (child, parent) =>
    mapped(child["align-self"] ?? parent["align-items"] ?? "stretch", { stretch: "STRETCH" });
  return {
    vertical: {
      direction: mapped(vertical["flex-direction"], { column: direction.column }),
      mediaAlign: stretch(media, vertical),
    },
    horizontal: {
      direction: mapped(horizontal["flex-direction"], { row: direction.row }),
      mediaWidth: dimension(sideMedia["inline-size"]),
      mediaAlign: stretch(sideMedia, horizontal),
    },
    media: {
      justify: mapped(media["justify-content"], alignment),
      align: mapped(media["align-items"], alignment),
    },
    body: { gap: dimension(body.gap), padding: dimension(body.padding) },
  };
}

export function tokenPayload(source) {
  const modes = generate(source);
  const payload = {};
  for (const [theme, tree] of Object.entries(modes)) {
    const tokens = {};
    function visit(node, path = []) {
      if (!Object.hasOwn(node, "$value")) {
        for (const [name, child] of Object.entries(node)) {
          if (!name.startsWith("$")) visit(child, [...path, name]);
        }
        return;
      }
      const types = {
        color: "COLOR",
        dimension: "FLOAT",
        number: "FLOAT",
        string: "STRING",
        boolean: "BOOLEAN",
      };
      const type = types[node.$type];
      if (!type) throw new Error(`Unsupported Figma variable type: ${node.$type}`);
      const raw = node.$value;
      const alias =
        typeof raw === "string" && /^\{.+\}$/.test(raw)
          ? raw.slice(1, -1).replaceAll(".", "/")
          : null;
      let value = raw;
      if (!alias && node.$type === "color") {
        const [r, g, b] = raw.components;
        value = { r, g, b, a: raw.alpha ?? 1 };
      } else if (!alias && node.$type === "dimension") value = raw.value;
      tokens[path.join("/")] = alias ? { type, alias } : { type, value };
    }
    visit(tree);
    for (const token of Object.values(tokens)) {
      if (token.alias && tokens[token.alias]?.type !== token.type)
        throw new Error(`Invalid token alias: ${token.alias}`);
    }
    payload[theme === "light" ? "Light" : "Dark"] = tokens;
  }
  return payload;
}

export const BUTTON_VARIANTS = ["default", "primary", "secondary", "ghost", "danger"];
const BUTTON_COLORS = { background: "background", foreground: "color", border: "border-color" };

/**
 * Read from the Button CSS the token each variant and state paints with, so the
 * Figma Button binds to the same exported variables the component reads.
 */
export function extractButtonStyles(source, tokens) {
  const byProperty = new Map(tokenEntries(tokens).map(([path]) => [cssName(path), path]));
  const rules = parse(source).css.children;
  const declarations = (selector) => {
    const rule = rules.find(
      (item) =>
        item.type === "Rule" &&
        source.slice(item.prelude.start, item.prelude.end).trim() === selector,
    );
    return new Map(
      (rule?.block.children ?? [])
        .filter((item) => item.type === "Declaration")
        .map((item) => [item.property, item.value]),
    );
  };
  const tokenOf = (property, value) => {
    const path = byProperty.get(/^var\((--ds-[\w-]+)\)$/.exec(value)?.[1]);
    if (!path) throw new Error(`Figma Button export: unsupported ${property} ${value}`);
    return path;
  };
  const token = (selector, property) => {
    const value = declarations(selector).get(property);
    if (!value) throw new Error(`Figma Button export: missing ${selector} ${property}`);
    return tokenOf(property, value);
  };
  const disabled = declarations(".button:disabled");
  for (const property of Object.values(BUTTON_COLORS)) {
    if (disabled.has(property))
      throw new Error(`Figma Button export: unsupported disabled ${property}`);
  }
  const opacityPath = token(".button:disabled", "opacity");
  const opacity = resolveTokens(tokens).get(opacityPath);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1)
    throw new Error("Figma Button export: invalid disabled opacity");
  const border = /^(\d+)px solid /.exec(declarations(".button").get("border") ?? "");
  if (!border) throw new Error("Figma Button export: unsupported border");
  const variable = (path) => path.replaceAll(".", "/");
  const paints = {};
  const underline = [];
  for (const variant of BUTTON_VARIANTS) {
    const base = `.button:global([data-variant="${variant}"])`;
    const hover = declarations(`${base}:hover:not(:disabled)`);
    const resting = {};
    const hovered = {};
    for (const [paint, property] of Object.entries(BUTTON_COLORS)) {
      resting[paint] = variable(token(base, property));
      hovered[paint] = hover.has(property)
        ? variable(tokenOf(property, hover.get(property)))
        : resting[paint];
    }
    // :disabled changes only opacity, so disabled keeps the resting colours.
    paints[variant] = { default: resting, hover: hovered, disabled: resting };
    const decoration =
      declarations(`${base}:not(.button--icon-only)`).get("text-decoration") ??
      declarations(base).get("text-decoration");
    if (decoration === "underline") underline.push(variant);
  }
  return { paints, disabledOpacity: opacity, borderWidth: Number(border[1]), underline };
}

/** Every Button paint must name a colour variable the token export creates. */
export function checkButtonTokens(styles, payload) {
  for (const [variant, states] of Object.entries(styles.paints)) {
    for (const [state, paints] of Object.entries(states)) {
      for (const [property, name] of Object.entries(paints)) {
        if (payload.Light[name]?.type !== "COLOR" || payload.Dark[name]?.type !== "COLOR")
          throw new Error(
            `Figma Button export: ${variant}/${state}/${property} uses ${name}, which is not an exported colour token`,
          );
      }
    }
  }
}

export async function generatePlugin() {
  const layout = extractCardLayout(readFileSync(sourcePath, "utf8"));
  const buttonAppearance = readButtonAppearance();
  const plugin = readFileSync(resolve(root, "tools/figma-component-pilot/plugin.js"), "utf8")
    .replace(/^\/\* global .* \*\/\n/m, "")
    .replace(/^import .* from "\.\/(sync|tokens|button-colors).js";\n/gm, "");
  const sync = readFileSync(resolve(root, "tools/figma-component-pilot/sync.js"), "utf8")
    .replace(/^\/\* global .* \*\/\n/m, "")
    .replace(/^export /gm, "");
  const tokens = readFileSync(resolve(root, "tools/figma-component-pilot/tokens.js"), "utf8")
    .replace(/^\/\* global .* \*\/\n/m, "")
    .replace(/^export /gm, "");
  const tokenSource = readFileSync(resolve(root, "packages/tokens/tokens.json"), "utf8");
  const buttonColors = readFileSync(
    resolve(root, "tools/figma-component-pilot/button-colors.js"),
    "utf8",
  ).replace(/^export /gm, "");
  const canonical = JSON.parse(tokenSource);
  const payload = tokenPayload(canonical);
  const buttonStyles = extractButtonStyles(readFileSync(buttonPath, "utf8"), canonical);
  checkButtonTokens(buttonStyles, payload);
  const info = {
    revision: createHash("sha256").update(tokenSource).digest("hex").slice(0, 12),
    grey50: canonical.colors.palette.grey["50"].$value,
    grey950: canonical.colors.palette.grey["950"].$value,
    count: Object.keys(payload.Light).length,
  };
  const contents = `// Generated by pnpm components:figma. Edit the plugin sources, components or tokens.json.\n/* global figma, __html__ */\nconst CARD_LAYOUT = ${JSON.stringify(layout)};\nconst BUTTON_STYLES = ${JSON.stringify(buttonStyles)};\nconst BUTTON_APPEARANCE = ${JSON.stringify(buttonAppearance)};\nconst TOKEN_PAYLOAD = ${JSON.stringify(payload)};\nconst TOKEN_INFO = ${JSON.stringify(info)};\n${sync}\n${tokens}\n${buttonColors}\n${plugin}`;
  return format(contents, { ...(await resolveConfig(outputPath)), filepath: outputPath });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await generatePlugin();
  if (process.argv.includes("--check")) {
    if (readFileSync(outputPath, "utf8") !== output) {
      throw new Error("Figma component plugin is stale. Run pnpm components:figma.");
    }
  } else {
    writeFileSync(outputPath, output);
  }
}
