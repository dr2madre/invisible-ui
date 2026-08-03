import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Collapsible } from "./Collapsible";

const noAxeRegion = { rules: { region: { enabled: false } } };

const renderCollapsible = (props: Record<string, unknown> = {}) =>
  render(Collapsible, {
    props,
    slots: {
      trigger: () => "Details",
      default: () => h("p", "Hidden details here."),
    },
  });

describe("Vue Collapsible (styled)", () => {
  it("renders the trigger slot and keeps content hidden when closed", () => {
    renderCollapsible();
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("links the trigger to the content it controls", () => {
    renderCollapsible({ open: true });
    const trigger = screen.getByRole("button", { name: "Details" });
    const content = screen.getByText("Hidden details here.").parentElement;
    expect(trigger.getAttribute("aria-controls")).toBe(content?.id);
  });

  it("falls back to the label prop when no trigger slot is given", () => {
    render(Collapsible, { props: { label: "More" } });
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("expands the content on click and collapses it again", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderCollapsible({ onOpenChange });
    const trigger = screen.getByRole("button", { name: "Details" });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden details here.")).toBeVisible();

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("renders open when initialised open", () => {
    renderCollapsible({ open: true });
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Hidden details here.")).toBeVisible();
  });

  it("emits update:open so the state binds with v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = renderCollapsible();
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(emitted()["update:open"]).toEqual([[true]]);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderCollapsible({ disabled: true, onOpenChange });
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations when open", async () => {
    const { container } = renderCollapsible({ open: true });
    expect(await axe(container, noAxeRegion)).toHaveNoViolations();
  });
});
