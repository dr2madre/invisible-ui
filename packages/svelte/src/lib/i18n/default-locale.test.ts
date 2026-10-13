import { execFileSync } from "node:child_process";
import { render } from "@testing-library/svelte";
import { hydrate, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fixture from "./default-locale.fixture.svelte";

// June 2026 starts on a Monday, so the first cell of the grid names the
// week's first day.
const SUNDAY = "2026-05-31";
const MONDAY = "2026-06-01";

const firstCell = () => document.querySelector("[data-date]")?.getAttribute("data-date");
const hasDayPeriod = () => document.querySelector('[data-segment="dayPeriod"]') !== null;
const probe = () => document.querySelector("output")!;

function setPage(lang?: string, dir?: string) {
  const root = document.documentElement;
  if (lang === undefined) root.removeAttribute("lang");
  else root.setAttribute("lang", lang);
  if (dir === undefined) root.removeAttribute("dir");
  else root.setAttribute("dir", dir);
}

afterEach(() => {
  setPage();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Svelte default locale", () => {
  it("uses Monday and 24-hour time without a provider or a page language", async () => {
    render(Fixture);
    await tick();
    expect(probe()).toHaveTextContent("en-001-u-hc-h23");
    expect(probe()).toHaveAttribute("data-dir", "ltr");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("follows the page's lang and dir without a provider", async () => {
    setPage("en-US", "rtl");
    render(Fixture);
    await tick();
    expect(probe()).toHaveTextContent("en-US");
    expect(probe()).toHaveAttribute("data-dir", "rtl");
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
  });

  it("follows a change of the page's lang", async () => {
    setPage("en-US");
    render(Fixture);
    await tick();
    expect(firstCell()).toBe(SUNDAY);
    setPage("it-IT");
    await new Promise((resolve) => setTimeout(resolve));
    await tick();
    expect(firstCell()).toBe(MONDAY);
  });

  it("lets the provider's locale win over the page's", async () => {
    setPage("en-US");
    render(Fixture, { props: { locale: "it-IT" } });
    await tick();
    expect(probe()).toHaveTextContent("it-IT");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("server-renders the default and hydrates without a mismatch, then reads the page", async () => {
    // A real server runtime: a separate Node process with no DOM.
    const html = JSON.parse(
      execFileSync("node", ["scripts/render-hydration-fixture.mjs", "renderDefaultLocale"], {
        cwd: process.cwd(),
        encoding: "utf8",
      }),
    ) as string;
    expect(/role="columnheader" aria-label="([^"]+)"/.exec(html)?.[1]).toBe("Monday");
    expect(html).not.toContain('data-segment="dayPeriod"');

    setPage("en-US");
    document.body.innerHTML = `<div id="app">${html}</div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = hydrate(Fixture, { target: document.querySelector("#app")! });
    await tick();
    const messages = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .filter((message) => /hydration|mismatch/i.test(message));
    expect(messages).toEqual([]);
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
    await unmount(app);
  }, 30_000);
});
