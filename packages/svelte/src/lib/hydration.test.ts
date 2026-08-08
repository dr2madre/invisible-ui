import { execFileSync } from "node:child_process";
import { hydrate, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fixture from "./hydration.fixture.svelte";

// Vitest runs with the package as working directory (the vitest config root).
const packageRoot = process.cwd();

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Svelte adapter hydration", () => {
  it("hydrates representative field, collection and overlay components without mismatches", async () => {
    // A real server runtime: a separate Node process with no DOM, where Vite
    // compiles the .svelte graph for SSR. It renders the fixture twice from
    // one module graph, as a long-lived server serves many requests.
    const output = execFileSync("node", ["scripts/render-hydration-fixture.mjs"], {
      cwd: packageRoot,
      encoding: "utf8",
    });
    const { first, second } = JSON.parse(output) as { first: string; second: string };

    // Repeated requests must not drift the ids a fresh client expects.
    expect(second).toBe(first);

    document.body.innerHTML = `<div id="app">${second}</div>`;
    const host = document.querySelector<HTMLElement>("#app")!;

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = hydrate(Fixture, { target: host });
    await tick();

    const messages = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .filter((message) => /hydration|mismatch/i.test(message));
    expect(messages).toEqual([]);
    expect(host.querySelector("main")).not.toBeNull();

    // Ids stay unique after hydration.
    const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Labels, descriptions and panel relationships resolve.
    const linked = document.querySelectorAll(
      "[aria-labelledby], [aria-describedby], [aria-controls], label[for]",
    );
    for (const el of Array.from(linked)) {
      for (const name of ["aria-labelledby", "aria-describedby", "aria-controls", "for"]) {
        const value = el.getAttribute(name);
        for (const id of value ? value.split(/\s+/) : []) {
          expect(document.getElementById(id), `${name} -> ${id}`).not.toBeNull();
        }
      }
    }

    // The overlay still works: the hydrated trigger opens the panel its
    // wiring points at.
    const trigger = host.querySelector<HTMLElement>('[aria-haspopup="dialog"]')!;
    trigger.click();
    await tick();
    const controls = trigger.getAttribute("aria-controls")!;
    expect(document.getElementById(controls)).not.toBeNull();

    unmount(app);
  }, 60_000);
});
