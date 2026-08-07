import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Vue adapter hydration", () => {
  it("hydrates representative stateful, overlay and date components without mismatches", async () => {
    const serverVue = await import("vue");
    const { renderToString } = await import("@vue/server-renderer");
    const { HydrationFixture: ServerFixture } = await import("./hydration.fixture");
    // A production SSR process serves many requests from the same module
    // graph. Render one response first to catch module-global id counters.
    await renderToString(serverVue.createSSRApp(ServerFixture));
    const ssrContext: { teleports?: Record<string, string> } = {};
    const serverHtml = await renderToString(serverVue.createSSRApp(ServerFixture), ssrContext);

    // Server and browser execute separate bundles. Resetting the module graph
    // reproduces that boundary, including each adapter module's deterministic
    // per-instance id counter starting from the same state on both sides.
    vi.resetModules();

    const clientVue = await import("vue");
    const { HydrationFixture: ClientFixture } = await import("./hydration.fixture");
    document.body.innerHTML = `<div id="app">${serverHtml}</div>${ssrContext.teleports?.body ?? ""}`;
    const host = document.querySelector<HTMLElement>("#app")!;

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = clientVue.createSSRApp(ClientFixture);

    app.mount(host);
    await clientVue.nextTick();

    const messages = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .filter((message) => /hydration|mismatch/i.test(message));
    expect(messages).toEqual([]);
    expect(host.querySelector("main")).not.toBeNull();
    expect(host.querySelector('[role="combobox"]')).not.toBeNull();
    expect(host.querySelector('[role="grid"]')).not.toBeNull();
    expect(host.querySelector('[role="listbox"]')).toBeNull();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();

    app.unmount();
  });
});
