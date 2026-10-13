// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { manage, type ManageOptions } from "./dom";

// The rule applied to a real DOM: tab stops, keys, and what happens when
// toggles come and go. The adapters' suites drive the same behaviour through
// their components, and the browser tests in `e2e/` through a real keyboard.
describe("toggle group manage", () => {
  const teardowns: Array<() => void> = [];
  afterEach(() => {
    for (const teardown of teardowns.splice(0)) teardown();
    document.body.innerHTML = "";
  });

  /** A group with one toggle per name; `!` before a name disables it. */
  function group(names: string[], options?: ManageOptions, host: HTMLElement = document.body) {
    const root = document.createElement("div");
    root.setAttribute("role", "group");
    for (const name of names) root.append(toggle(name));
    host.append(root);
    teardowns.push(manage(root, options));
    return root;
  }

  function toggle(name: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toggle";
    button.disabled = name.startsWith("!");
    button.textContent = name.replace("!", "");
    return button;
  }

  const byName = (root: HTMLElement, name: string) =>
    Array.from(root.querySelectorAll("button")).find((b) => b.textContent === name)!;

  const tabIndexes = (root: HTMLElement) =>
    Array.from(root.querySelectorAll("button")).map((b) => b.getAttribute("tabindex"));

  /** Press `key` on the focused element; whether the group took it. */
  function press(key: string): boolean {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(event);
    return event.defaultPrevented;
  }

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("leaves one or two toggles as their own tab stops, with no keys", () => {
    const root = group(["Bold", "Italic"]);
    expect(tabIndexes(root)).toEqual([null, null]);
    byName(root, "Bold").focus();
    expect(press("ArrowRight")).toBe(false);
    expect(document.activeElement).toBe(byName(root, "Bold"));
  });

  it("makes three toggles one tab stop, on the first enabled one", () => {
    const root = group(["!Bold", "Italic", "Underline"]);
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("moves focus with the arrows, wrapping, skipping disabled toggles, and with Home and End", () => {
    const root = group(["Bold", "!Italic", "Underline", "Strike"]);
    byName(root, "Bold").focus();
    expect(press("ArrowRight")).toBe(true);
    expect(document.activeElement).toBe(byName(root, "Underline"));
    expect(tabIndexes(root)).toEqual(["-1", "-1", "0", "-1"]);
    press("End");
    expect(document.activeElement).toBe(byName(root, "Strike"));
    press("ArrowRight");
    expect(document.activeElement).toBe(byName(root, "Bold"));
    press("ArrowLeft");
    expect(document.activeElement).toBe(byName(root, "Strike"));
    press("Home");
    expect(document.activeElement).toBe(byName(root, "Bold"));
    expect(press("ArrowDown")).toBe(false);
    expect(press("a")).toBe(false);
  });

  it("mirrors Left and Right in right-to-left text", () => {
    const root = group(["Bold", "Italic", "Underline"]);
    root.style.direction = "rtl";
    byName(root, "Bold").focus();
    press("ArrowLeft");
    expect(document.activeElement).toBe(byName(root, "Italic"));
  });

  it("uses Up and Down when vertical, reading the axis when the key arrives", () => {
    let orientation: "horizontal" | "vertical" = "horizontal";
    const root = group(["Bold", "Italic", "Underline"], { orientation: () => orientation });
    orientation = "vertical";
    byName(root, "Bold").focus();
    expect(press("ArrowRight")).toBe(false);
    press("ArrowDown");
    expect(document.activeElement).toBe(byName(root, "Italic"));
  });

  it("keeps the tab stop on the toggle focused last", () => {
    const root = group(["Bold", "Italic", "Underline"]);
    byName(root, "Italic").focus();
    byName(root, "Italic").blur();
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("moves focus to the toggle now at the removed one's place", async () => {
    const root = group(["Bold", "Italic", "Underline", "Strike"]);
    byName(root, "Italic").focus();
    byName(root, "Italic").remove();
    await flush();
    expect(document.activeElement).toBe(byName(root, "Underline"));
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("moves focus to the last toggle when the removed one was last", async () => {
    const root = group(["Bold", "Italic", "Underline", "Strike"]);
    byName(root, "Strike").focus();
    byName(root, "Strike").remove();
    await flush();
    expect(document.activeElement).toBe(byName(root, "Underline"));
  });

  it("does not pull focus back after it left the group, and keeps the tab stop at that place", async () => {
    const root = group(["Bold", "Italic", "Underline", "Strike"]);
    const after = document.body.appendChild(toggle("After"));
    byName(root, "Italic").focus();
    after.focus();
    await flush();
    byName(root, "Italic").remove();
    await flush();
    expect(document.activeElement).toBe(after);
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("gives each toggle its own tab stop back when going down to two", async () => {
    const root = group(["Bold", "Italic", "Underline"]);
    byName(root, "Italic").remove();
    await flush();
    expect(tabIndexes(root)).toEqual([null, null]);
  });

  it("keeps focus where it is when a toggle is added, going up to one tab stop", async () => {
    const root = group(["Bold", "Underline"]);
    byName(root, "Underline").focus();
    root.append(toggle("Strike"));
    await flush();
    expect(document.activeElement).toBe(byName(root, "Underline"));
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("follows a toggle that becomes disabled", async () => {
    const root = group(["Bold", "Italic", "Underline"]);
    byName(root, "Bold").disabled = true;
    await flush();
    expect(tabIndexes(root)).toEqual(["-1", "0", "-1"]);
  });

  it("adds no tab stop and no keys inside a toolbar", () => {
    const toolbar = document.createElement("div");
    toolbar.setAttribute("role", "toolbar");
    document.body.append(toolbar);
    const root = group(["Bold", "Italic", "Underline"], {}, toolbar);
    expect(tabIndexes(root)).toEqual([null, null, null]);
    byName(root, "Bold").focus();
    expect(press("ArrowRight")).toBe(false);
  });

  it("leaves the toggles of a nested group to that group", async () => {
    const outer = group(["Bold", "Italic"]);
    const inner = group(["A", "B", "C"], {}, outer);
    await flush();
    expect(tabIndexes(inner)).toEqual(["0", "-1", "-1"]);
    expect(
      [byName(outer, "Bold"), byName(outer, "Italic")].map((b) => b.getAttribute("tabindex")),
    ).toEqual([null, null]);
  });

  it("finds the toggles with a custom selector", () => {
    const root = group(["Bold", "Italic", "Underline"], { selector: "[data-none]" });
    expect(tabIndexes(root)).toEqual([null, null, null]);
  });

  it("stops listening after teardown", async () => {
    const root = document.createElement("div");
    for (const name of ["Bold", "Italic", "Underline"]) root.append(toggle(name));
    document.body.append(root);
    const teardown = manage(root);
    teardown();
    byName(root, "Bold").focus();
    expect(press("ArrowRight")).toBe(false);
    root.append(toggle("Strike"));
    await flush();
    expect(byName(root, "Strike").hasAttribute("tabindex")).toBe(false);
  });
});
