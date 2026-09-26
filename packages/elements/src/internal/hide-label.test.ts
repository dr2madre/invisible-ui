import { screen } from "@testing-library/dom";
import "../define";

// Every field element takes `hide-label`: the label leaves the screen and
// stays the control's accessible name, so no consumer has to style the
// internal label class from outside.
describe("hide-label across field elements", () => {
  it.each([
    ["ds-checkbox", "checkbox", "field__label--hidden"],
    ["ds-switch", "switch", "field__label--hidden"],
    ["ds-textarea", "textbox", "field__label--hidden"],
    ["ds-combobox", "combobox", "combobox__label--hidden"],
  ])("%s keeps its hidden label as the accessible name", (tag, role, hiddenClass) => {
    document.body.innerHTML = `<${tag} label="Select all rows" hide-label></${tag}>`;
    const control = screen.getByRole(role, { name: "Select all rows" });
    expect(control).toBeInTheDocument();
    const label = document.querySelector(`.${hiddenClass}`);
    expect(label).toHaveTextContent("Select all rows");

    document.querySelector(tag)!.removeAttribute("hide-label");
    expect(document.querySelector(`.${hiddenClass}`)).toBeNull();
  });
});
