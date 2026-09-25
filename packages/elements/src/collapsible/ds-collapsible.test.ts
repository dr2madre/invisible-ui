import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsCollapsible } from "./ds-collapsible";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const host = () => document.querySelector("ds-collapsible") as DsCollapsible;

describe("<ds-collapsible>", () => {
  it("renders the trigger slot and keeps the content hidden when closed", () => {
    document.body.innerHTML = `
      <ds-collapsible>
        <span slot="trigger">Details</span>
        <p>Hidden details here.</p>
      </ds-collapsible>`;
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
    const content = screen.getByText("Hidden details here.");
    expect(content).not.toBeVisible();
    expect(trigger).toHaveAttribute("aria-controls", content.parentElement!.id);
    expect(content.parentElement).toHaveClass("collapsible__content");
  });

  it("toggles open on click and reports the change", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-collapsible label="Details"><p>Hidden details here.</p></ds-collapsible>`;
    const onOpenChange = vi.fn();
    host().addEventListener("open-change", (event) =>
      onOpenChange((event as CustomEvent).detail.open),
    );

    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Hidden details here.")).toBeVisible();
    expect(host().open).toBe(true);
    expect(host()).toHaveAttribute("open");
  });

  it("renders open and reports closing", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-collapsible label="Details" open><p>Hidden details here.</p></ds-collapsible>`;
    const onOpenChange = vi.fn();
    host().addEventListener("open-change", (event) =>
      onOpenChange((event as CustomEvent).detail.open),
    );
    expect(screen.getByText("Hidden details here.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("follows the open property without reporting it", () => {
    document.body.innerHTML = `<ds-collapsible label="Details"><p>Body</p></ds-collapsible>`;
    const onOpenChange = vi.fn();
    host().addEventListener("open-change", onOpenChange);
    host().open = true;
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("ignores clicks while disabled", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-collapsible label="Details" disabled><p>Body</p></ds-collapsible>`;
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("names the trigger from the catalog when no label is given", () => {
    document.body.innerHTML = `<ds-collapsible><p>Body</p></ds-collapsible>`;
    expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
  });

  it("translates the default trigger text for the locale around it", () => {
    document.body.innerHTML = `
      <ds-locale-provider locale="it"><ds-collapsible><p>Body</p></ds-collapsible></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, string>;
    };
    provider.messages = { "collapsible.toggle": "Mostra" };
    expect(screen.getByRole("button", { name: "Mostra" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    document.body.innerHTML = `<ds-collapsible label="Details" open><p>Body</p></ds-collapsible>`;
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
