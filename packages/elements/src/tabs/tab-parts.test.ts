import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsTabs } from "./ds-tabs";

// Composed tabs: the strip in a header beside a button, the panels below.
const MARKUP = `
  <ds-tabs value="form">
    <header>
      <ds-tab-list label="Editor">
        <ds-tab value="form">Form</ds-tab>
        <ds-tab value="preview">Preview <ds-count count="3"></ds-count></ds-tab>
        <ds-tab value="history" disabled>History</ds-tab>
      </ds-tab-list>
      <button type="button">Close</button>
    </header>
    <ds-tab-panel value="form"><p>Form fields</p></ds-tab-panel>
    <ds-tab-panel value="preview"><p>Rendered preview</p></ds-tab-panel>
    <ds-tab-panel value="history"><p>Past versions</p></ds-tab-panel>
  </ds-tabs>`;

const mount = (html = MARKUP) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-tabs") as DsTabs;
};

describe("composed <ds-tabs>", () => {
  it("keeps the markup and wires the list, tabs and panels", () => {
    mount();
    const list = screen.getByRole("tablist", { name: "Editor" });
    expect(list.tagName).toBe("DS-TAB-LIST");
    const tab = screen.getByRole("tab", { name: "Form" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel.tagName).toBe("DS-TAB-PANEL");
    expect(panel).toHaveTextContent("Form fields");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(screen.getByRole("tab", { name: /Preview/ })).toContainElement(
      document.querySelector("ds-count"),
    );
  });

  it("selects with a click and the arrow keys, skipping the disabled tab", async () => {
    const user = userEvent.setup();
    const tabs = mount();
    const seen: string[] = [];
    tabs.addEventListener("change", (e) => seen.push((e as CustomEvent).detail.value));

    await user.click(screen.getByRole("tab", { name: /Preview/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Rendered preview");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Form" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Form fields");
    expect(seen).toEqual(["preview", "form"]);
    expect(tabs).toHaveAttribute("value", "form");
  });

  it("follows a value set from outside", () => {
    const tabs = mount();
    tabs.setAttribute("value", "preview");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Rendered preview");
  });

  it("wires a tab added later", () => {
    mount();
    const tab = document.createElement("ds-tab");
    tab.setAttribute("value", "notes");
    tab.textContent = "Notes";
    document.querySelector("ds-tab-list")!.appendChild(tab);
    expect(screen.getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "false");
  });

  it("leaves a nested tabs element its own parts", () => {
    mount(`
      <ds-tabs>
        <ds-tab-list label="Outer"><ds-tab value="a">A</ds-tab></ds-tab-list>
        <ds-tab-panel value="a">
          <ds-tabs>
            <ds-tab-list label="Inner"><ds-tab value="x">X</ds-tab></ds-tab-list>
            <ds-tab-panel value="x">Inner panel</ds-tab-panel>
          </ds-tabs>
        </ds-tab-panel>
      </ds-tabs>`);
    const outer = screen.getByRole("tab", { name: "A" });
    const inner = screen.getByRole("tab", { name: "X" });
    expect(outer.id).not.toBe(inner.id);
    expect(screen.getByText("Inner panel")).toHaveAttribute("aria-labelledby", inner.id);
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
