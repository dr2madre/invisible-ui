import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsSegmentedControl } from "./ds-segmented-control";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };
const group = () => screen.getByRole("radiogroup", { name: "View" });

const markup = (attrs = "") => `<ds-segmented-control label="View" name="view" ${attrs}>
  <option value="list">List</option>
  <option value="board">Board</option>
  <option value="calendar">Calendar</option>
</ds-segmented-control>`;

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-segmented-control") as DsSegmentedControl;
};

const iconItems = [
  { value: "list", label: "List", icon: "M8 6h13M8 12h13M8 18h13" },
  { value: "board", label: "Board", icon: "M3 3h7v18H3zM14 3h7v10h-7z" },
];

// Arrow-key movement between segments is the browser's (native radios); jsdom
// does not implement it.
describe("<ds-segmented-control>", () => {
  it("renders a horizontal, named radio group with the selected segment checked", () => {
    mount(markup('value="list"'));
    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute("data-state", "checked");
  });

  it("selects on click and reports the change", async () => {
    const user = userEvent.setup();
    const host = mount(markup('value="list"'));
    const seen: string[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    await user.click(screen.getByRole("radio", { name: "Board" }));

    expect(host.value).toBe("board");
    expect(seen).toEqual(["board"]);
    expect(screen.getByRole("radio", { name: "Board" })).toHaveAttribute("data-state", "checked");
  });

  it("submits the selected value under its name", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form>${markup('value="list"')}</form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("view")).toBe("list");

    await user.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(new FormData(form).get("view")).toBe("calendar");
  });

  it("groups the segments when no name is given", () => {
    mount(markup().replace('name="view" ', ""));
    const names = screen.getAllByRole("radio").map((radio) => radio.getAttribute("name"));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("falls back to the value when an item has no label", () => {
    const host = mount(markup());
    host.items = [{ value: "list" }];
    expect(screen.getByRole("radio", { name: "list" })).toBeInTheDocument();
  });

  it("keeps the group label available to assistive tech when hidden", () => {
    mount(markup("hide-label"));
    expect(group()).toBeInTheDocument();
    expect(document.querySelector(".segmented-field__label--hidden")).not.toBeNull();
  });

  it("is inert when disabled, and comes back when re-enabled", async () => {
    const user = userEvent.setup();
    const host = mount(markup('value="list"'));
    const seen = vi.fn();
    host.addEventListener("change", seen);

    host.setAttribute("disabled", "");
    const board = screen.getByRole("radio", { name: "Board" });
    expect(board).toBeDisabled();
    await user.click(board);
    expect(seen).not.toHaveBeenCalled();

    host.removeAttribute("disabled");
    await user.click(board);
    expect(host.value).toBe("board");
  });

  it("has no accessibility violations", async () => {
    mount(markup('value="list"'));
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("<ds-segmented-control> icons and layouts", () => {
  it("icon-only names each segment through aria-label and leaves the text out", () => {
    const host = mount(markup('value="list" icon-only'));
    host.items = iconItems;
    expect(within(group()).getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.queryByText("List")).toBeNull();
    expect(document.querySelectorAll(".segment--icon-only")).toHaveLength(2);
  });

  it("reads the icon path from the option's data-icon", () => {
    mount(`<ds-segmented-control label="View" icon-only>
      <option value="list" data-icon="M8 6h13">List</option>
    </ds-segmented-control>`);
    expect(document.querySelector(".segment__icon path")).toHaveAttribute("d", "M8 6h13");
    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
  });

  it("stacked shows the icon above a visible label", () => {
    const host = mount(markup('value="list" icon-only stacked'));
    host.items = iconItems;
    const segment = screen.getByRole("radio", { name: "List" }).closest(".segment")!;
    const icon = segment.querySelector(".segment__icon")!;
    const label = segment.querySelector(".segment__label")!;
    expect(label).toHaveTextContent("List");
    expect(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("vertical exposes a vertical radio group", () => {
    mount(markup('value="list" orientation="vertical"'));
    expect(group()).toHaveAttribute("aria-orientation", "vertical");
    expect(group()).toHaveClass("segmented--vertical");
  });

  it("keeps a choice when the layout attributes change", async () => {
    const user = userEvent.setup();
    const host = mount(markup('value="list"'));
    host.items = iconItems;
    await user.click(screen.getByRole("radio", { name: "Board" }));

    host.setAttribute("icon-only", "");
    expect(screen.getByRole("radio", { name: "Board" })).toBeChecked();
  });

  it("has no accessibility violations (icon-only, vertical)", async () => {
    const host = mount(markup('value="list" icon-only orientation="vertical"'));
    host.items = iconItems;
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
