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

  it("keeps the ids the page set in aria-describedby", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <p id="hint">Opens the table settings</p>
      <ds-tooltip text="Settings for this table">
        <button type="button" aria-label="Settings" aria-describedby="hint">⚙</button>
      </ds-tooltip>`;
    const button = screen.getByRole("button", { name: "Settings" });
    await user.tab();
    const tip = screen.getByRole("tooltip");
    expect(button.getAttribute("aria-describedby")).toBe(`hint ${tip.id}`);
    await user.keyboard("{Escape}");
    expect(button.getAttribute("aria-describedby")).toBe("hint");
  });

  it("mounts the tooltip inside an open modal dialog", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <ds-dialog heading="Table" trigger="Open">
        <ds-tooltip text="Settings for this table">
          <button type="button" aria-label="Settings">⚙</button>
        </ds-tooltip>
      </ds-dialog>`;
    await user.click(screen.getByRole("button", { name: "Open" }));
    screen.getByRole("button", { name: "Settings" }).focus();
    const panel = screen.getByRole("dialog");
    expect(panel).toContainElement(screen.getByRole("tooltip"));
  });
});
