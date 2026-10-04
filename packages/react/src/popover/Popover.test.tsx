import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Dialog } from "../dialog/Dialog";
import { Popover, type PopoverProps } from "./Popover";

function Fixture(props: Partial<PopoverProps>) {
  return (
    <>
      <button type="button">before</button>
      <Popover triggerContent={<span>Open popover</span>} {...props}>
        <p>Popover body</p>
        <button type="button">Action</button>
      </Popover>
      <button type="button">after</button>
    </>
  );
}

function HoverFixture(props: Partial<PopoverProps>) {
  return (
    <>
      <a href="#before">before</a>
      <Popover
        trigger="hover"
        openDelay={0}
        closeDelay={0}
        triggerContent={<a href="#ada">@ada</a>}
        {...props}
      >
        <div>
          <strong>Ada Lovelace</strong>
          <p>Mathematician, the first programmer.</p>
        </div>
      </Popover>
      <a href="#after">after</a>
    </>
  );
}

const trigger = () => screen.getByRole("button", { name: "Open popover" });
const card = () => document.querySelector<HTMLElement>(".popover__content");
const hoverTrigger = () => document.querySelector<HTMLElement>(".popover__hover-trigger")!;

afterEach(() => vi.useRealTimers());

describe("React Popover", () => {
  it("is closed by default with the trigger advertising the panel", () => {
    render(<Fixture />);
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Popover body")).toBeNull();
  });

  it("opens on click, moves focus into the panel, and reports it open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Fixture onOpenChange={onOpenChange} />);
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", card()!.id);
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("uses the catalog's trigger label by default", () => {
    render(<Popover>Body</Popover>);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("gives the panel a name, from the trigger by default", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Fixture />);
    await user.click(trigger());
    expect(screen.getByRole("dialog", { name: "Open popover" })).toBeInTheDocument();
    rerender(<Fixture label="Quick settings" />);
    expect(screen.getByRole("dialog", { name: "Quick settings" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Popover body")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside pointer press without moving focus back", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "before" }));
    expect(screen.queryByText("Popover body")).toBeNull();
    expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
  });

  it("closes when focus leaves the trigger and the panel", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    act(() => screen.getByRole("button", { name: "after" }).focus());
    expect(screen.queryByText("Popover body")).toBeNull();
  });

  it("reflects a controlled open state without reporting it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Fixture open={false} onOpenChange={onOpenChange} />);
    rerender(<Fixture open onOpenChange={onOpenChange} />);
    expect(screen.getByText("Popover body")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("works controlled by a parent that echoes the value back", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Fixture
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(trigger());
    expect(screen.getByText("Popover body")).toBeInTheDocument();
    await user.click(trigger());
    expect(screen.queryByText("Popover body")).toBeNull();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("renders the panel inside an open dialog (ADR 0016)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Settings" open>
        <Fixture />
      </Dialog>,
    );
    await user.click(trigger());
    expect(screen.getByRole("dialog", { name: "Settings" })).toContainElement(card());
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});

describe("React Popover (trigger=hover)", () => {
  it("is closed by default", () => {
    render(<HoverFixture />);
    expect(card()).toBeNull();
  });

  it("opens on keyboard focus of the trigger without moving focus", () => {
    const onOpenChange = vi.fn();
    render(<HoverFixture onOpenChange={onOpenChange} />);
    act(() => screen.getByRole("link", { name: "@ada" }).focus());
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(card()!.contains(document.activeElement)).toBe(false);
  });

  it("opens on pointer enter and closes on pointer leave", () => {
    render(<HoverFixture />);
    fireEvent.pointerEnter(hoverTrigger(), { pointerType: "mouse" });
    expect(card()).not.toBeNull();
    fireEvent.pointerLeave(hoverTrigger(), { pointerType: "mouse" });
    expect(card()).toBeNull();
  });

  it("waits for the delays, and stays open while the pointer is over the card", () => {
    vi.useFakeTimers();
    render(<HoverFixture openDelay={300} closeDelay={200} />);
    fireEvent.pointerEnter(hoverTrigger(), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(299));
    expect(card()).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(card()).not.toBeNull();
    fireEvent.pointerLeave(hoverTrigger(), { pointerType: "mouse" });
    fireEvent.pointerEnter(card()!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(500));
    expect(card()).not.toBeNull();
    fireEvent.pointerLeave(card()!, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(200));
    expect(card()).toBeNull();
  });

  it("first click opens the preview; once open the default proceeds", () => {
    render(<HoverFixture />);
    const link = screen.getByRole("link", { name: "@ada" });
    expect(fireEvent.click(link)).toBe(false);
    expect(card()).not.toBeNull();
    expect(fireEvent.click(link)).toBe(true);
  });

  it("closes on a second tap", () => {
    render(<HoverFixture />);
    const link = screen.getByRole("link", { name: "@ada" });
    fireEvent.pointerDown(link, { pointerType: "touch" });
    fireEvent.click(link);
    expect(card()).not.toBeNull();
    fireEvent.pointerDown(link, { pointerType: "touch" });
    fireEvent.click(link);
    expect(card()).toBeNull();
  });

  it("closes when focus leaves the trigger and card", () => {
    render(<HoverFixture />);
    act(() => screen.getByRole("link", { name: "@ada" }).focus());
    expect(card()).not.toBeNull();
    act(() => screen.getByRole("link", { name: "after" }).focus());
    expect(card()).toBeNull();
  });

  it("closes on Escape", () => {
    render(<HoverFixture />);
    act(() => screen.getByRole("link", { name: "@ada" }).focus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(card()).toBeNull();
  });

  it("holds no focusable content", () => {
    render(<HoverFixture />);
    fireEvent.pointerEnter(hoverTrigger(), { pointerType: "mouse" });
    expect(
      card()!.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).toHaveLength(0);
  });

  it("has no accessibility violations when open", async () => {
    render(<HoverFixture />);
    fireEvent.pointerEnter(hoverTrigger(), { pointerType: "mouse" });
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
