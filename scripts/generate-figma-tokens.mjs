#!/usr/bin/env node
// Generate the two DTCG files Figma imports as the Light and Dark modes of
// one collection. The repository source stays authoritative.
//
//   pnpm tokens:figma          # write the files
//   pnpm tokens:figma:check    # fail if the committed files are stale

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { modeTokens, setToken, validateTokenModel } from "./token-model.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "packages/tokens/tokens.json");
const outputDirectory = resolve(root, "packages/tokens/figma");
const themes = ["light", "dark"];
const supportedTypes = new Set(["boolean", "color", "dimension", "duration", "number", "string"]);

function fail(message) {
  throw new Error(`Figma token export: ${message}`);
}

/** Convert a six-digit hexadecimal colour to Figma's DTCG colour object. */
export function colorObject(hex, alpha = 1) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) fail(`unsupported colour "${hex}"`);
  if (typeof alpha !== "number" || alpha < 0 || alpha > 1)
    fail(`invalid alpha "${alpha}" for ${hex}`);
  const digits = hex.slice(1);
  return {
    colorSpace: "srgb",
    components: [0, 2, 4].map(
      (offset) => Number.parseInt(digits.slice(offset, offset + 2), 16) / 255,
    ),
    alpha,
    hex: hex.toUpperCase(),
  };
}

/** Convert a canonical value to the subset of DTCG that Figma imports. */
export function transformValue(value, type) {
  if (typeof value === "string" && /^\{[^{}]+\}$/.test(value)) return value;

  if (type === "color" && value === "transparent") return colorObject("#000000", 0);
  if (type === "color" && typeof value === "string") return colorObject(value);
  if (type === "color" && value && typeof value === "object") {
    const { colorSpace, components, alpha = 1, hex } = value;
    if (colorSpace !== "srgb" || !Array.isArray(components) || components.length !== 3)
      fail(`unsupported colour ${JSON.stringify(value)}`);
    // The canonical channels are exact; hex is the 8-bit rounding of them.
    const fallback = colorObject(String(hex), alpha);
    return { ...fallback, components: [...components] };
  }

  if (type === "dimension" && typeof value === "string") {
    const match = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)$/.exec(value);
    if (!match) fail(`unsupported dimension "${value}"`);
    const amount = Number(match[1]) * (match[2] === "rem" ? 16 : 1);
    return { value: amount, unit: "px" };
  }

  return value;
}

/** Convert one resolved-mode token, dropping repository-only metadata. */
export function transformToken(path, token) {
  const outputType = token.$type === "fontWeight" ? "number" : token.$type;
  if (!supportedTypes.has(outputType)) fail(`${path} uses unsupported type "${token.$type}"`);
  const output = { $type: outputType, $value: transformValue(token.$value, outputType) };
  if (token.$description) output.$description = token.$description;
  return output;
}

function leafPaths(node, path = [], output = []) {
  if (Object.hasOwn(node, "$value")) {
    output.push(path.join("/"));
    return output;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$")) leafPaths(child, [...path, key], output);
  }
  return output;
}

/**
 * Build one mode. Every canonical token keeps its path; the mode override in
 * `com.invisible-ui.modes` replaces the Light value, so both files expose the
 * same variable names. A mix recipe exports its resolved colour: Figma
 * variables cannot mix.
 */
export function buildMode(source, theme) {
  if (!themes.includes(theme)) fail(`unknown theme "${theme}"`);
  const tokens = modeTokens(source, theme);
  const output = {};
  for (const [path, token] of tokens) {
    const ref = typeof token.$value === "string" && /^\{([^{}]+)\}$/.exec(token.$value);
    if (ref && !tokens.has(ref[1])) fail(`${path} refers to the missing token ${ref[1]}`);
    setToken(output, path, transformToken(path, token));
  }
  return output;
}

export function generate(source) {
  validateTokenModel(source);
  const modes = Object.fromEntries(themes.map((theme) => [theme, buildMode(source, theme)]));
  const paths = Object.fromEntries(themes.map((theme) => [theme, leafPaths(modes[theme]).sort()]));
  if (JSON.stringify(paths.light) !== JSON.stringify(paths.dark))
    fail("Light and Dark do not expose the same variable paths");
  return modes;
}

function outputPath(theme) {
  return resolve(outputDirectory, `invisible-ui-${theme}.tokens.json`);
}

async function render(value) {
  const prettierConfig = (await resolveConfig(sourcePath)) ?? {};
  return format(JSON.stringify(value), { ...prettierConfig, parser: "json" });
}

export async function run({ check = false } = {}) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const modes = generate(source);
  let stale = false;

  if (!check) mkdirSync(outputDirectory, { recursive: true });
  for (const theme of themes) {
    const destination = outputPath(theme);
    const expected = await render(modes[theme]);
    const name = relative(root, destination);
    if (check) {
      let actual = "";
      try {
        actual = readFileSync(destination, "utf8");
      } catch {
        // A missing generated file is stale too.
      }
      if (actual !== expected) {
        console.error(`${name} is stale: run "pnpm tokens:figma".`);
        stale = true;
      }
    } else {
      writeFileSync(destination, expected);
      console.log(`Wrote ${name} (${leafPaths(modes[theme]).length} variables).`);
    }
  }

  if (stale) process.exitCode = 1;
  else if (check) console.log("Figma token files match packages/tokens/tokens.json.");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const unknown = process.argv.slice(2).filter((argument) => argument !== "--check");
  if (unknown.length) fail(`unknown option "${unknown[0]}"`);
  await run({ check: process.argv.includes("--check") });
}
