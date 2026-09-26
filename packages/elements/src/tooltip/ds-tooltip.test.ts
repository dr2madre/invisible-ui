import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { vi } from "vitest";
import "../define";

const mount = () => {
  document.body.innerHTML = `
    <ds-tooltip text="Settings for this table">
      <button type="button" aria-label="Settings">⚙</button>
    </ds-tooltip>`;
  return screen.getByRole("button", { name: "Settings" });
};

describe("<ds-tooltip>", () => {
  afterEach(() => vi.useRealTimers());

  it("opens at once on keyboard focus and describes the control", async () => {
    const user = userEvent.setup();
    const button = mount();
    await user.tab();
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Settings for this table");
    expect(button).toHaveAccessibleDescription("Settings for this table");
    expect(button).toHaveFocus();
  });

  it("closes on focus out and on Escape", async () => {
    const user = userEvent.setup();
    const button = mount();
    await user.tab();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(button).not.toHaveAttribute("aria-describedby");

    await user.tab({ shift: true });
    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens on hover after the delay and stays while the pointer is on it", () => {
    vi.useFakeTimers();
    mount();
    const host = document.querySelector("ds-tooltip")!;
    fireEvent.pointerEnter(host, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    vi.advanceTimersByTime(300);
    const tip = screen.getByRole("tooltip");
    fireEvent.pointerLeave(host);
    fireEvent.pointerEnter(tip);
    vi.advanceTimersByTime(500);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerLeave(tip);
    vi.advanceTimersByTime(100);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("removes its tooltip when the element leaves the page", async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    document.querySelector("ds-tooltip")!.remove();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("has no accessibility violations while open", async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
