import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, h, nextTick, type PropType } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { HoverCard } from "./HoverCard";

// The card teleports to document.body, so the axe scan covers the whole page;
// the landmark (region) rule judges the bare fixture's page structure, not the
// component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

/** A link preview, zero delays so the tests stay synchronous. */
const Fixture = defineComponent({
  props: {
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  setup(props) {
    return () => [
      h("a", { href: "#before" }, "before"),
      h(
        HoverCard,
        { openDelay: 0, closeDelay: 0, onOpenChange: props.onOpenChange },
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

const card = () => document.querySelector<HTMLElement>(".hover-card__content");
// pointerenter/leave don't bubble, so the wrapper (which carries the
// listeners) must be the event target.
const triggerWrap = () => document.querySelector<HTMLElement>(".hover-card__trigger")!;

describe("Vue HoverCard (styled)", () => {
  afterEach(() => vi.useRealTimers());

  it("is closed by default and marks the trigger closed", () => {
    render(Fixture);
    expect(card()).toBeNull();
    expect(triggerWrap()).toHaveAttribute("data-state", "closed");
  });

  it("opens on pointer enter and closes on pointer leave", async () => {
    render(Fixture);

    await fireEvent.pointerEnter(triggerWrap());
    expect(card()).not.toBeNull();
    expect(triggerWrap()).toHaveAttribute("data-state", "open");

    await fireEvent.pointerLeave(triggerWrap());
    expect(card()).toBeNull();
  });

  it("opens on keyboard focus of the trigger without moving focus into the card", async () => {
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });

    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(card()!.contains(document.activeElement)).toBe(false);
  });

  it("stays open while the pointer is over the card", async () => {
    // A real close delay, driven by fake timers: the leave schedules the
    // close and entering the card must cancel it before it fires.
    vi.useFakeTimers();
    render(HoverCard, {
      props: { openDelay: 0, closeDelay: 50 },
      slots: {
        trigger: () => h("a", { href: "#ada" }, "@ada"),
        default: () => h("p", "Ada Lovelace"),
      },
    });

    await fireEvent.pointerEnter(triggerWrap());
    expect(card()).not.toBeNull();

    await fireEvent.pointerLeave(triggerWrap());
    await fireEvent.pointerEnter(card()!);
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(card()).not.toBeNull();
  });

  it("first click opens the preview; once open the default proceeds", async () => {
    render(Fixture);
    const link = screen.getByRole("link", { name: "@ada" });

    const first = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(first);
    await nextTick();
    expect(first.defaultPrevented).toBe(true);
    expect(card()).not.toBeNull();

    const second = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(second);
    await nextTick();
    expect(second.defaultPrevented).toBe(false);
  });

  it("closes when focus leaves the trigger and card", async () => {
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.focusIn(screen.getByRole("link", { name: "after" }));
    expect(card()).toBeNull();
  });

  it("closes on Escape", async () => {
    render(Fixture);
    await fireEvent.focusIn(screen.getByRole("link", { name: "@ada" }));
    expect(card()).not.toBeNull();

    await fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).toBeNull();
  });

  it("emits update:open so the state binds with v-model", async () => {
    const { emitted } = render(HoverCard, {
      props: { openDelay: 0, closeDelay: 0 },
      slots: { trigger: () => h("a", { href: "#x" }, "x"), default: () => "card" },
    });
    await fireEvent.pointerEnter(triggerWrap());
    expect(emitted()["update:open"]).toEqual([[true]]);
  });

  // The card is supplementary: nothing inside takes focus.
  // Interactive content belongs to Popover's trigger="click".
  it("holds no focusable content", async () => {
    render(Fixture);
    await fireEvent.pointerEnter(triggerWrap());

    const focusable = card()!.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable).toHaveLength(0);
  });

  it("has no accessibility violations when open", async () => {
    render(Fixture);
    await fireEvent.pointerEnter(triggerWrap());
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
