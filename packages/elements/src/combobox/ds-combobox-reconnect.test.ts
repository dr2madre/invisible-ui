import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The listbox follows its input through a subscription that the element sets
// up when it opens. Being taken out of the page cancels that subscription, so
// the element has to start a new one when it comes back: without a stand-in
// for Floating UI there is nothing to observe, since the real one needs a
// ResizeObserver that this environment does not have.
// One cleanup per subscription, so a subscription stopped twice cannot look
// like two subscriptions stopped once.
const live = new Set<() => void>();
const autoUpdate = vi.fn(() => {
  const stop = () => live.delete(stop);
  live.add(stop);
  return stop;
});

vi.mock("@floating-ui/dom", () => ({
  autoUpdate,
  computePosition: () => Promise.resolve({ x: 0, y: 0 }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
}));

await import("../define");

const MARKUP = `
  <ds-combobox label="Fruit" name="fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
  </ds-combobox>`;

const input = () => screen.getByRole("combobox") as HTMLInputElement;

describe("<ds-combobox> reconnecting", () => {
  beforeEach(() => {
    autoUpdate.mockClear();
    live.clear();
    // The real thing is skipped without a ResizeObserver.
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it("follows its input again after being moved while open", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = MARKUP;
    const host = document.querySelector("ds-combobox")!;
    await user.type(input(), "a");
    expect(live.size, "opening starts following the input").toBe(1);

    const parent = host.parentElement!;
    host.remove();
    expect(live.size, "removal stops following it").toBe(0);
    parent.appendChild(host);
    expect(live.size, "and coming back starts again").toBe(1);
  });

  it("never follows the same input twice over", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = MARKUP;
    const host = document.querySelector("ds-combobox")!;
    await user.type(input(), "a");
    const parent = host.parentElement!;

    for (let move = 0; move < 3; move += 1) {
      host.remove();
      parent.appendChild(host);
    }
    // Exactly the one that belongs to the open list, never a pile of them.
    expect(live.size).toBe(1);
    host.remove();
    // And nothing left running once it is gone for good.
    expect(live.size).toBe(0);
  });
});
