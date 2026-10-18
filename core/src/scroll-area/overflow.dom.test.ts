// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { observeInlineOverflow } from "./overflow";

const sizes = (node: HTMLElement, scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(node, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(node, "clientWidth", { configurable: true, value: clientWidth });
};

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: () => void) {
    FakeObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.push(element);
  }
  disconnect() {
    this.disconnected = true;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeObserver.instances = [];
});

describe("observeInlineOverflow", () => {
  it("reports the first measure, then only when the answer flips", () => {
    vi.stubGlobal("ResizeObserver", FakeObserver);
    const node = document.createElement("div");
    node.appendChild(document.createElement("table"));
    sizes(node, 600, 300);
    const onChange = vi.fn();
    const stop = observeInlineOverflow(node, onChange);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);

    const observer = FakeObserver.instances[0]!;
    expect(observer.observed).toContain(node);
    expect(observer.observed).toContain(node.firstElementChild);

    observer.callback();
    expect(onChange).toHaveBeenCalledTimes(1);
    sizes(node, 300, 300);
    observer.callback();
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
    expect(observer.disconnected).toBe(true);
  });

  it("measures once and observes nothing without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const node = document.createElement("div");
    sizes(node, 100, 200);
    const onChange = vi.fn();
    const stop = observeInlineOverflow(node, onChange);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(() => stop()).not.toThrow();
  });
});
