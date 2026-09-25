import { render, screen } from "@testing-library/vue";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { Switch } from "./switch/Switch";
import { Textarea } from "./textarea/Textarea";

// Every field component takes `hideLabel`: the label leaves the screen and
// stays the control's accessible name.
describe("hideLabel across field components", () => {
  it.each([
    ["Checkbox", Checkbox, "checkbox", {}, "field__label--hidden"],
    ["Switch", Switch, "switch", {}, "field__label--hidden"],
    ["Textarea", Textarea, "textbox", {}, "field__label--hidden"],
    ["Combobox", Combobox, "combobox", { items: [{ value: "it" }] }, "combobox__label--hidden"],
  ] as const)(
    "%s keeps its hidden label as the accessible name",
    (_, Component, role, extra, hidden) => {
      const { container } = render(Component as never, {
        props: { label: "Select all rows", hideLabel: true, ...extra } as never,
      });
      expect(screen.getByRole(role, { name: "Select all rows" })).toBeInTheDocument();
      expect(container.querySelector(`.${hidden}`)).toHaveTextContent("Select all rows");
    },
  );
});
