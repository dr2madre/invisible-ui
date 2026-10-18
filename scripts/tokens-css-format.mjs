import { readFileSync } from "node:fs";
import { cssName, modeTokens, MIX } from "./token-model.mjs";

export function cssValue(value) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string")
    return value.replace(/\{([^{}]+)\}/g, (_, path) => `var(${cssName(path)})`);
  return `rgb(${value.components.map((c) => Math.round(c * 255)).join(" ")} / ${value.alpha ?? 1})`;
}

export function cssExpression(token) {
  const mix = token.$extensions?.[MIX];
  return mix
    ? `color-mix(in srgb, ${cssValue(mix.base)} ${Number((mix.amount * 100).toFixed(8))}%, ${cssValue(mix.with)})`
    : cssValue(token.$value);
}

export function cssTokensFormat({ dictionary }) {
  const tree = JSON.parse(readFileSync(dictionary.allTokens[0].filePath, "utf8"));
  const declarations = (mode) =>
    [...modeTokens(tree, mode)]
      .map(([path, token]) => `  ${cssName(path)}: ${cssExpression(token)};`)
      .join("\n");
  return `:root, [data-theme="light"] {\n${declarations("light")}\n}\n[data-theme="dark"] {\n${declarations("dark")}\n}\n@media (prefers-color-scheme: dark) {\n:root:not([data-theme="light"]) {\n${declarations("dark")}\n}\n}\n`;
}
