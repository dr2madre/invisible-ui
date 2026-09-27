import { fireEvent, render, screen } from "@testing-library/vue";
import { h, nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachFloating } from "../internal/floating";
import { HoverCard } from "../hover-card/HoverCard";
import { Tooltip } from "../tooltip/Tooltip";
import { Popover } from "./Popover";

// The spy records the options positioning was given; jsdom has no layout to
// compute against, so it positions nothing.
vi.mock("../internal/floating", () => ({ attachFloating: vi.fn(() => () => {}) }));

const floating = vi.mocked(attachFloating);
const lastPlacement = () => floating.mock.calls.at(-1)?.[2]?.placement;
const lastOffset = () => floating.mock.calls.at(-1)?.[2]?.offset;

beforeEach(() => floating.mockClear());

describe("Vue overlays mounted open", () => {
  // The panel's template ref is assigned after the composable ran, so an
  // effect keyed on the open flag alone found no element and skipped
  // positioning, dismiss and focus until the state changed.
  it("positions a popover mounted open, moves focus in and closes on Escape", async () => {
    const onOpenChange = vi.fn();
    render(Popover, {
      props: { open: true, onOpenChange },
      slots: {
        trigger: () => "Open popover",
        default: () => h("button", { type: "button" }, "Action"),
      },
    });
    await nextTick();

    expect(floating).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();

    await fireEvent.keyDown(screen.getByRole("button", { name: "Action" }), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("wires a hover card mounted open, so Escape closes it", async () => {
    const onOpenChange = vi.fn();
    render(HoverCard, {
      props: { open: true, openDelay: 0, closeDelay: 0, onOpenChange },
      slots: {
        trigger: () => h("a", { href: "#ada" }, "@ada"),
        default: () => h("strong", "Ada Lovelace"),
      },
    });
    await nextTick();

    expect(floating).toHaveBeenCalledTimes(1);
    await fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("Vue overlays follow placement changed while open", () => {
  it("moves an open popover to a new placement", async () => {
    const { rerender } = render(Popover, {
      props: { open: true, placement: "bottom" },
      slots: { trigger: () => "Open popover", default: () => "Body" },
    });
    await nextTick();
    expect(lastPlacement()).toBe("bottom");

    await rerender({ open: true, placement: "top" });
    await nextTick();
    expect(lastPlacement()).toBe("top");
  });

  it("moves an open hover card to a new placement and offset", async () => {
    const { rerender } = render(HoverCard, {
      props: { open: true, placement: "bottom", offset: 8 },
      slots: { trigger: () => h("a", { href: "#ada" }, "@ada"), default: () => "Ada" },
    });
    await nextTick();
    expect(lastPlacement()).toBe("bottom");

    await rerender({ open: true, placement: "right", offset: 20 });
    await nextTick();
    expect(lastPlacement()).toBe("right");
    expect(lastOffset()).toBe(20);
  });

  it("moves an open tooltip to a new placement", async () => {
    const { container, rerender } = render(Tooltip, {
      props: { text: "Copy", openDelay: 0, closeDelay: 0, placement: "top" },
      slots: { default: () => h("button", { type: "button" }, "Copy") },
    });
    await fireEvent.pointerEnter(container.querySelector(".tooltip__trigger")!);
    await screen.findByRole("tooltip");
    expect(lastPlacement()).toBe("top");

    await rerender({ text: "Copy", openDelay: 0, closeDelay: 0, placement: "bottom" });
    await nextTick();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(lastPlacement()).toBe("bottom");
  });
});
