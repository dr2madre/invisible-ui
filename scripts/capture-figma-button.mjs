import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { createPreviewServer } from "../packages/svelte/scripts/figma-preview-server.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const playwrightRequire = createRequire(
  createRequire(import.meta.url).resolve("@playwright/test/package.json"),
);
const output = resolve(root, "tools/figma-component-pilot/button-appearance.json");
export const buttonInputs = [
  "packages/svelte/src/lib/button/Button.svelte",
  "packages/svelte/src/lib/button/create-button.ts",
  "packages/svelte/src/lib/styles/tokens.css",
  "packages/tokens/tokens.json",
  "packages/svelte/figma-preview/ButtonPreview.svelte",
  "packages/svelte/figma-preview/main.js",
  "packages/svelte/figma-preview/index.html",
  "scripts/capture-figma-button.mjs",
  "packages/svelte/scripts/figma-preview-server.mjs",
];
export function buttonSourceHash() {
  const hash = createHash("sha256");
  for (const path of buttonInputs) hash.update(path).update(readFileSync(resolve(root, path)));
  return hash.digest("hex");
}

export function readButtonAppearance() {
  const captured = JSON.parse(readFileSync(output, "utf8"));
  if (captured.sourceHash !== buttonSourceHash())
    throw new Error(
      "Button appearance is stale. Run pnpm components:figma to capture the component again.",
    );
  return captured;
}

export async function captureButton({ check = false } = {}) {
  const { chromium } = playwrightRequire("playwright");
  const server = await createPreviewServer({
    configFile: false,
    root: resolve(root, "packages/svelte/figma-preview"),
    server: { host: "127.0.0.1", port: 0, fs: { allow: [root] } },
    logLevel: "error",
  });
  let browser;
  try {
    await server.listen();
    const localChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
    browser = await chromium.launch(
      existsSync(localChromium) ? { executablePath: localChromium } : {},
    );
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const address = server.httpServer.address();
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('button[data-variant="default"]').first().waitFor();
    const themes = {};
    mkdirSync(resolve(root, "output/playwright"), { recursive: true });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((name) => (document.documentElement.dataset.theme = name), theme);
      themes[theme] = {};
      for (const variant of ["default", "primary", "secondary", "ghost", "danger"]) {
        themes[theme][variant] = {};
        for (const state of ["default", "hover", "disabled"]) {
          const button = page.locator(`[data-case="${variant}/${state}"] button`);
          await page.mouse.move(0, 0);
          if (state === "hover") await button.hover();
          const actualState = await button.evaluate((element) => ({
            disabled: element.disabled,
            hovered: element.matches(":hover"),
            variant: element.dataset.variant,
          }));
          if (
            actualState.disabled !== (state === "disabled") ||
            actualState.hovered !== (state === "hover") ||
            actualState.variant !== variant
          )
            throw new Error(`Button state did not settle: ${variant}/${state}`);
          await button.evaluate(async (element) => {
            void getComputedStyle(element).backgroundColor;
            await Promise.all(element.getAnimations().map((animation) => animation.finished));
          });
          await button.screenshot({
            path: resolve(root, `output/playwright/button-${theme}-${variant}-${state}.png`),
            animations: "disabled",
          });
          themes[theme][variant][state] = await button.evaluate((element) => {
            const css = getComputedStyle(element);
            function color(value) {
              const srgb = value.startsWith("color(srgb ");
              if (!srgb && !/^rgba?\(/.test(value)) throw new Error(`Unsupported colour: ${value}`);
              const numbers = value
                .replace(/^color\(srgb\s+|^rgba?\(/, "")
                .replace(/\)$/, "")
                .split(/[\s,/]+/)
                .filter(Boolean)
                .map(Number);
              if (
                numbers.some((number) => !Number.isFinite(number)) ||
                ![3, 4].includes(numbers.length)
              )
                throw new Error(`Unsupported colour: ${value}`);
              const [r, g, b, a = 1] = numbers;
              return {
                r: r / (srgb ? 1 : 255),
                g: g / (srgb ? 1 : 255),
                b: b / (srgb ? 1 : 255),
                a,
              };
            }
            if (css.backgroundImage !== "none" || css.boxShadow !== "none" || css.filter !== "none")
              throw new Error("Unsupported Button effects");
            const sides = ["Top", "Right", "Bottom", "Left"];
            if (
              sides.some(
                (side) =>
                  css[`border${side}Color`] !== css.borderTopColor ||
                  css[`border${side}Width`] !== css.borderTopWidth ||
                  css[`border${side}Style`] !== "solid",
              )
            )
              throw new Error("Unsupported Button border");
            if (!["none", "underline"].includes(css.textDecorationLine))
              throw new Error("Unsupported text decoration");
            return {
              background: color(css.backgroundColor),
              foreground: color(css.color),
              border: color(css.borderTopColor),
              borderWidth: parseFloat(css.borderTopWidth),
              opacity: Number(css.opacity),
              underline: css.textDecorationLine === "underline",
            };
          });
        }
      }
      await page.mouse.move(0, 0);
      await page.screenshot({
        path: resolve(root, `output/playwright/button-reference-${theme}.png`),
      });
    }
    if (errors.length) throw new Error(errors.join("\n"));
    for (const variant of Object.keys(themes.light)) {
      for (const state of Object.keys(themes.light[variant])) {
        for (const property of ["opacity", "borderWidth", "underline"]) {
          if (themes.light[variant][state][property] !== themes.dark[variant][state][property])
            throw new Error(`Theme-dependent ${property} needs an adapter: ${variant}/${state}`);
        }
      }
    }
    const captured = { sourceHash: buttonSourceHash(), themes };
    const content = await format(JSON.stringify(captured), {
      ...(await resolveConfig(output)),
      filepath: output,
    });
    if (check) {
      if (readFileSync(output, "utf8") !== content)
        throw new Error("Browser styles differ from the Button export. Run pnpm components:figma.");
    } else writeFileSync(output, content);
    console.log(`Button: 30 variant/state/theme combinations ${check ? "verified" : "captured"}.`);
    return captured;
  } finally {
    await browser?.close();
    await server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await captureButton({ check: process.argv.includes("--check") });
