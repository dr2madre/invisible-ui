import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Dialog } from "../dialog/Dialog";
import { Tooltip, type TooltipProps } from "./Tooltip";

function Fixture(props: Partial<TooltipProps>) {
  return (
    <Tooltip text="Copy to clipboard" {...props}>
      <button type="button">Copy</button>
    </Tooltip>
  );
}

const button = () => screen.getByRole("button", { name: "Copy" });
const wrapper = () => document.querySelector<HTMLElement>(".tooltip__trigger")!;

afterEach(() => vi.useRealTimers());

describe("React Tooltip", () => {
  it("is hidden until the trigger is focused or hovered", () => {
    render(<Fixture />);
    expect(button()).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows on focus, linking the trigger by aria-describedby, and hides on blur", () => {
    render(<Fixture />);
    act(() => button().focus());
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Copy to clipboard");
    expect(wrapper()).toHaveAttribute("aria-describedby", tip.id);
    act(() => button().blur());
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(wrapper()).not.toHaveAttribute("aria-describedby");
  });

  it("is dismissable with Escape, even while hovered", async () => {
    const user = userEvent.setup();
    render(<Fixture openDelay={0} />);
    fireEvent.pointerEnter(wrapper(), { pointerType: "mouse" });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens after the open delay and stays open while the tooltip is hovered", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    fireEvent.pointerEnter(wrapper(), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(299));
    expect(screen.queryByRole("tooltip")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    const tip = screen.getByRole("tooltip");
    fireEvent.pointerLeave(wrapper(), { pointerType: "mouse" });
    fireEvent.pointerEnter(tip, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerLeave(tip, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("follows an open delay changed after mount", () => {
    const { rerender } = render(<Fixture openDelay={60_000} />);
    rerender(<Fixture openDelay={0} />);
    fireEvent.pointerEnter(wrapper(), { pointerType: "mouse" });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("toggles on a tap, where hover does not exist", () => {
    render(<Fixture />);
    fireEvent.pointerEnter(wrapper(), { pointerType: "touch" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerDown(button(), { pointerType: "touch" });
    fireEvent.click(button());
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerDown(button(), { pointerType: "touch" });
    fireEvent.click(button());
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders inside an open dialog (ADR 0016)", () => {
    render(
      <Dialog title="Settings" open>
        <Fixture />
      </Dialog>,
    );
    act(() => button().focus());
    expect(screen.getByRole("dialog")).toContainElement(screen.getByRole("tooltip"));
  });

  it("has no accessibility violations when shown", async () => {
    render(<Fixture />);
    act(() => button().focus());
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
