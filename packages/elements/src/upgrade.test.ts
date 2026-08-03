import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vitest";

describe("server-rendered custom-element upgrade", () => {
  it("upgrades declarative light-DOM markup after the registration script loads", async () => {
    document.body.innerHTML = `
      <ds-button variant="primary">Save</ds-button>
      <ds-select label="Fruit" value="pear">
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </ds-select>
    `;

    expect(customElements.get("ds-button")).toBeUndefined();

    await import("./define");

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-variant", "primary");
    expect(screen.getByRole("combobox", { name: "Fruit" })).toHaveValue("pear");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Apple",
      "Pear",
    ]);
  });
});
