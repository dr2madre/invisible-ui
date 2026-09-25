import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsTabs, TabsItem } from "./ds-tabs";

const items: TabsItem[] = [
  { value: "form", label: "Form" },
  { value: "preview", label: "Preview" },
];

// The strip in a header, the panels in the page body.
const mount = () => {
  document.body.innerHTML = `
    <header>
      <ds-tabs id="editor-tabs" label="Editor"></ds-tabs>
      <button type="button">Close</button>
    </header>
    <main>
      <ds-tab-panel for="editor-tabs" value="form"><p>Form fields</p></ds-tab-panel>
      <ds-tab-panel for="editor-tabs" value="preview"><p>Rendered preview</p></ds-tab-panel>
    </main>`;
  const tabs = document.querySelector("ds-tabs") as DsTabs;
  tabs.items = items;
  return tabs;
};

describe("<ds-tab-panel>", () => {
  it("links external panels to their tabs and renders no panel inside the strip", () => {
    const tabs = mount();
    expect(tabs.querySelector(".tabs__panel")).toBeNull();

    const tab = screen.getByRole("tab", { name: "Form" });
    const panel = screen.getByRole("tabpanel");
    expect(panel.tagName).toBe("DS-TAB-PANEL");
    expect(panel).toHaveTextContent("Form fields");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(screen.getByText("Rendered preview").closest("ds-tab-panel")).toHaveAttribute("hidden");
  });

  it("switches the visible external panel with the selected tab", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Rendered preview");
    expect(screen.getByText("Form fields").closest("ds-tab-panel")).toHaveAttribute("hidden");
  });

  it("falls back to its own panels when the last external panel leaves", () => {
    const tabs = mount();
    for (const panel of document.querySelectorAll("ds-tab-panel")) panel.remove();
    expect(tabs.querySelectorAll(".tabs__panel")).toHaveLength(2);
  });

  it("links a panel written before its tabs", () => {
    document.body.innerHTML = `
      <ds-tab-panel for="late-tabs" value="form">Form fields</ds-tab-panel>
      <ds-tabs id="late-tabs" label="Editor"></ds-tabs>`;
    (document.querySelector("ds-tabs") as DsTabs).items = items;
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Form fields");
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
