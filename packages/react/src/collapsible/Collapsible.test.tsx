import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Collapsible } from "./Collapsible";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("React Collapsible (styled)", () => {
  it("renders a trigger linked to hidden content when closed", () => {
    render(<Collapsible label="Details">Hidden details here.</Collapsible>);
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveTextContent(
      "Hidden details here.",
    );
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("names the trigger from the catalog, or from the trigger content", () => {
    const { unmount } = render(<Collapsible>Body</Collapsible>);
    expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
    unmount();
    render(
      <LocaleProvider locale="it" messages={{ "collapsible.toggle": "Mostra" }}>
        <Collapsible>Body</Collapsible>
        <Collapsible trigger={<strong>Rich</strong>}>Body</Collapsible>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Mostra" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rich" })).toBeInTheDocument();
  });

  it("toggles on click and reports each change once", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Collapsible label="Details" onOpenChange={onOpenChange}>
        Hidden details here.
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Hidden details here.")).toBeVisible();
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("toggles with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Collapsible label="Details">Body</Collapsible>);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("does not toggle when disabled, and toggles once enabled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible label="Details" disabled onOpenChange={onOpenChange}>
        Body
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();

    rerender(
      <Collapsible label="Details" onOpenChange={onOpenChange}>
        Body
      </Collapsible>,
    );
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("reflects a controlled open state without reporting it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible label="Details" onOpenChange={onOpenChange}>
        Body
      </Collapsible>,
    );
    rerender(
      <Collapsible label="Details" open onOpenChange={onOpenChange}>
        Body
      </Collapsible>,
    );
    expect(screen.getByText("Body")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <Collapsible label="Details" open>
        Body
      </Collapsible>,
    );
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
