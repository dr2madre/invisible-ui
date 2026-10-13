// @vitest-environment node
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calendar } from "@design-system/core";
import type { renderWeekStart } from "./week-start-ssr-entry";

/** The long weekday name the first column carries (0 = Sunday). */
const firstWeekdayName = (locale: string, weekday: number) =>
  new Intl.DateTimeFormat(locale, { weekday: "long" }).format(calendar.weekdayDate(weekday));

/** The aria-label of the first weekday column header in server markup. */
const firstColumn = (html: string) => {
  const header = html.match(/<[^>]*role="columnheader"[^>]*>/)?.[0] ?? "";
  return header.match(/aria-label="([^"]*)"/)?.[1];
};

// The test runner compiles components for the browser; a Vite SSR module
// graph compiles them for the server, where the provider's context reaches
// the calendar as it does in production.
let server: ViteDevServer;
let render: typeof renderWeekStart;

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL("../../..", import.meta.url)),
    logLevel: "silent",
    server: { middlewareMode: true, hmr: false },
    plugins: [svelte()],
  });
  const entry = await server.ssrLoadModule("/src/lib/calendar/week-start-ssr-entry.ts");
  render = entry.renderWeekStart as typeof renderWeekStart;
}, 30_000);

afterAll(async () => {
  await server?.close();
});

// The week start comes from the provider's locale, never the runtime's, so
// the server renders the first column the client does
// (calendar-week-start.test.ts expects the same names).
describe("Svelte Calendar week start on the server", () => {
  it.each([
    ["en", 0],
    ["en-US", 0],
    ["it-IT", 1],
    ["ar-EG", 6],
  ])("starts the week of %s on weekday %i", (locale, weekday) => {
    expect(firstColumn(render({ locale }))).toBe(firstWeekdayName(locale, weekday));
  });

  it("lets the prop override the locale", () => {
    expect(firstColumn(render({ locale: "en-US", weekStartsOn: 1 }))).toBe("Monday");
  });
});
