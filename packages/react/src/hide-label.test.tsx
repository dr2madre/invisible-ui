import { render, screen } from "@testing-library/react";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { Switch } from "./switch/Switch";

// Every field component takes `hideLabel`: the label leaves the screen and
// stays the control's accessible name.
describe("hideLabel across field components", () => {
  it("Checkbox keeps its hidden label as the accessible name", () => {
    const { container } = render(<Checkbox label="Select all rows" hideLabel />);
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
    expect(container.querySelector(".field__label--hidden")).toHaveTextContent("Select all rows");
  });

  it("Switch keeps its hidden label as the accessible name", () => {
    const { container } = render(<Switch label="Notifications" hideLabel />);
    expect(screen.getByRole("switch", { name: "Notifications" })).toBeInTheDocument();
    expect(container.querySelector(".field__label--hidden")).toHaveTextContent("Notifications");
  });

  it("Combobox keeps its hidden label as the accessible name", () => {
    const { container } = render(<Combobox label="Country" hideLabel items={[{ value: "it" }]} />);
    expect(screen.getByRole("combobox", { name: "Country" })).toBeInTheDocument();
    expect(container.querySelector(".combobox__label--hidden")).toHaveTextContent("Country");
  });
});
