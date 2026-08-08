import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Popover } from "./Popover";

// The overlay teleports to document.body, so the axe scan covers the whole
// page; the landmark (region) rule judges the bare fixture's page structure,
// not the component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

/** Click mode, with outside elements to press and to move focus to. */
const ClickFixture = defineComponent({
  props: {
    onOpenChange: {
      type: Function as PropType<(open: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () => [
      h("button", { type: "button" }, "before"),
      h(
        Popover,
        { onOpenChange: props.onOpenChange },
        {
          trigger: () => "Open popover",
          default: () => [
            h("p", "Popover body"),
            h("button", { class: "inside", type: "button" }, "Action"),
          ],
        },
      ),
      h("button", { type: "button" }, "after"),
    ];
  },
});

/** Hover mode: a link preview, zero delays so tests stay synchronous. */
const HoverFixture = defineComponent({
  props: {
    onOpenChange: {
      type: Function as PropType<(open: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () => [
      h("a", { href: "#before" }, "before"),
      h(
        Popover,
        { trigger: "hover", openDelay: 0, closeDelay: 0, onOpenChange: props.onOpenChange },
        {
          trigger: () => h("a", { href: "#ada" }, "@ada"),
          // Supplementary preview: nothing focusable inside.
          default: () => [
            h("strong", "Ada Lovelace"),
            h("p", "Mathematician, the first programmer."),
          ],
        },
      ),
      h("a", { href: "#after" }, "after"),
    ];
  },
});

describe("Vue Popover (styled)", () => {
  it("is closed by default with the trigger advertising the panel", () => {
    render(ClickFixture);
    const trigger = screen.getByRole("button", { name: "Open popover" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("opens on click, moves focus into the panel, and reports it open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(ClickFixture, { props: { onOpenChange } });
    const trigger = screen.getByRole("button", { name: "Open popover" });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Popover body")).toBeInTheDocument();
    // Focus moved to the first focusable inside the panel.
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(ClickFixture);
    const trigger = screen.getByRole("button", { name: "Open popover" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    render(ClickFixture);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByText("Popover body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "before" }));
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(ClickFixture);
    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});

describe("Vue Popover (trigger=hover)", () => {
  const card = () => document.querySelector<HTMLElement>(".popover__content");
  // pointerenter/leave don't bubble, so the wrapper (which carries the
  // listeners) must be the event target.
  const triggerWrap = () => document.querySelector<HTMLElement>(".popover__hover-trigger")!;

  it("is closed by default", () => {
    render(HoverFixture);
    expect(card()).toBeNull();
  });

  it("opens on keyboard focus of the trigger without moving focus", async () => {
    const onOpenChange = vi.fn();
    render(HoverFixture, { props: { onOpenChange } });

    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus is NOT moved into the card.
    expect(card()!.contains(document.activeElement)).toBe(false);
  });

  it("opens on pointer enter and closes on pointer leave", async () => {
    render(HoverFixture);

    await fireEvent.pointerEnter(triggerWrap());
    expect(card()).not.toBeNull();

    await fireEvent.pointerLeave(triggerWrap());
    expect(card()).toBeNull();
  });

  it("first click opens the preview; once open the default proceeds", async () => {
    render(HoverFixture);
    const link = screen.getByRole("link", { name: "@ada" });

    // Closed: the click is consumed to open the preview (touch fallback).
    const first = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(first);
    await nextTick();
    expect(first.defaultPrevented).toBe(true);
    expect(card()).not.toBeNull();

    // Open: the click is not intercepted, so the link would navigate.
    const second = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(second);
    await nextTick();
    expect(second.defaultPrevented).toBe(false);
  });

  it("closes when focus leaves the trigger and card", async () => {
    render(HoverFixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.focusIn(screen.getByRole("link", { name: "after" }));
    expect(card()).toBeNull();
  });

  it("closes on Escape", async () => {
    render(HoverFixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).toBeNull();
  });

  // The hover preview is supplementary: nothing inside takes focus.
  // Interactive content belongs to trigger="click".
  it("holds no focusable content", async () => {
    render(HoverFixture);
    await fireEvent.pointerEnter(triggerWrap());

    const focusable = card()!.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable).toHaveLength(0);
  });

  it("has no accessibility violations when open", async () => {
    render(HoverFixture);
    await fireEvent.pointerEnter(triggerWrap());
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
