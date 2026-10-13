import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

/** The group follows its children through a MutationObserver; let it run. */
const observed = () => new Promise((resolve) => setTimeout(resolve, 0));

const toggleMarkup = (names: string[]) =>
  names.map((name) => `<ds-toggle-button label="${name}">${name}</ds-toggle-button>`).join("");

const mount = async (attrs = "", names = ["List", "Board", "Calendar"]) => {
  document.body.innerHTML = `<button>Before</button><ds-toggle-group ${attrs}>${toggleMarkup(
    names,
  )}</ds-toggle-group><button>After</button>`;
  await observed();
  return document.querySelector("ds-toggle-group")!;
};

const button = (name: string) => screen.getByRole("button", { name });
const tabIndexes = () =>
  Array.from(document.querySelectorAll(".toggle-group button.toggle")).map((el) =>
    el.getAttribute("tabindex"),
  );

describe("<ds-toggle-group>", () => {
  it("is a role=group carrying the optional container name", async () => {
    await mount('label="View"');
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent toggle button", async () => {
    await mount();
    for (const name of ["List", "Board", "Calendar"]) {
      expect(screen.getByRole("group")).toContainElement(
        screen.getByRole("button", { name, pressed: false }),
      );
    }
  });

  it("toggles each child independently", async () => {
    const user = userEvent.setup();
    await mount();
    await user.click(button("List"));
    await user.click(button("Board"));
    expect(button("List")).toHaveAttribute("aria-pressed", "true");
    expect(button("Board")).toHaveAttribute("aria-pressed", "true");
    expect(button("Calendar")).toHaveAttribute("aria-pressed", "false");
  });

  it("lays the toggles out as siblings, so a segmented group draws its dividers", async () => {
    await mount('variant="segmented"');
    const group = screen.getByRole("group");
    expect(group).toHaveClass("toggle-group", "toggle-group--segmented");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    // The divider rule matches `> :not(:first-child) .toggle__surface`.
    expect(group.querySelectorAll(":scope > :not(:first-child) .toggle__surface")).toHaveLength(2);
  });

  it("follows its attributes after mount", async () => {
    const host = await mount();
    const group = screen.getByRole("group");

    host.setAttribute("wrap", "");
    expect(group).toHaveClass("toggle-group--wrap");
    host.setAttribute("variant", "segmented");
    expect(group).not.toHaveClass("toggle-group--wrap");
    host.setAttribute("orientation", "vertical");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    host.setAttribute("label", "Layout");
    expect(screen.getByRole("group", { name: "Layout" })).toBe(group);
  });

  it("has no accessibility violations", async () => {
    await mount('label="View"');
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("<ds-toggle-group> keyboard with three or more toggles", () => {
  it("is one tab stop", async () => {
    const user = userEvent.setup();
    await mount();
    expect(tabIndexes()).toEqual(["0", "-1", "-1"]);

    button("Before").focus();
    await user.tab();
    expect(button("List")).toHaveFocus();
    await user.tab();
    expect(button("After")).toHaveFocus();
  });

  it("moves with the arrow keys, wrapping, and jumps with Home and End", async () => {
    const user = userEvent.setup();
    await mount();
    button("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(button("Board")).toHaveFocus();
    expect(tabIndexes()).toEqual(["-1", "0", "-1"]);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(button("List")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(button("Calendar")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(button("List")).toHaveFocus();
    await user.keyboard("{End}");
    expect(button("Calendar")).toHaveFocus();
  });

  it("returns Tab to the toggle focused last", async () => {
    const user = userEvent.setup();
    await mount();
    button("List").focus();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    expect(button("After")).toHaveFocus();
    await user.tab({ shift: true });
    expect(button("Board")).toHaveFocus();
  });

  it("mirrors Left and Right in right-to-left text", async () => {
    const user = userEvent.setup();
    const host = await mount();
    host.setAttribute("dir", "rtl");
    button("List").focus();

    await user.keyboard("{ArrowLeft}");
    expect(button("Board")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(button("List")).toHaveFocus();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    await mount('orientation="vertical"');
    button("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(button("List")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(button("Board")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(button("List")).toHaveFocus();
  });

  it("skips disabled toggles", async () => {
    const user = userEvent.setup();
    await mount();
    document.querySelectorAll("ds-toggle-button")[1]!.setAttribute("disabled", "");
    await observed();
    button("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(button("Calendar")).toHaveFocus();
  });

  it("puts the tab stop on an enabled toggle", async () => {
    await mount();
    document.querySelector("ds-toggle-button")!.setAttribute("disabled", "");
    await observed();
    expect(tabIndexes()).toEqual(["-1", "0", "-1"]);
  });

  it("moves focus without changing any toggle", async () => {
    const user = userEvent.setup();
    await mount();
    button("List").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{Home}{End}");
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("moves focus to the neighbour when the focused toggle is removed", async () => {
    const user = userEvent.setup();
    await mount();
    button("List").focus();
    await user.keyboard("{ArrowRight}");
    document.querySelectorAll("ds-toggle-button")[1]!.remove();
    await observed();
    expect(button("Calendar")).toHaveFocus();
  });

  it("keeps focus where it is when a toggle is added", async () => {
    const user = userEvent.setup();
    await mount();
    button("List").focus();
    await user.keyboard("{ArrowRight}");
    const extra = document.createElement("ds-toggle-button");
    extra.setAttribute("label", "Table");
    extra.textContent = "Table";
    screen.getByRole("group").prepend(extra);
    await observed();
    expect(button("Board")).toHaveFocus();
    expect(tabIndexes()).toEqual(["-1", "-1", "0", "-1"]);
  });

  it("gives each toggle its own tab stop again when it drops to two", async () => {
    await mount();
    document.querySelector("ds-toggle-button")!.remove();
    await observed();
    expect(tabIndexes()).toEqual([null, null]);
  });
});

describe("<ds-toggle-group> keyboard with one or two toggles", () => {
  it("sets no tabindex and leaves the arrow keys alone", async () => {
    const user = userEvent.setup();
    await mount("", ["List", "Board"]);
    expect(tabIndexes()).toEqual([null, null]);

    button("List").focus();
    await user.keyboard("{ArrowRight}");
    expect(button("List")).toHaveFocus();
    await user.tab();
    expect(button("Board")).toHaveFocus();
  });

  it("becomes one tab stop when a third toggle arrives", async () => {
    await mount("", ["List", "Board"]);
    const extra = document.createElement("ds-toggle-button");
    extra.setAttribute("label", "Calendar");
    extra.textContent = "Calendar";
    screen.getByRole("group").append(extra);
    await observed();
    expect(tabIndexes()).toEqual(["0", "-1", "-1"]);
  });
});

describe("<ds-toggle-group> inside a toolbar", () => {
  it("adds nothing: the toolbar's keys reach the toggles", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-toolbar label="Format"><ds-toggle-group label="Style">${toggleMarkup(
      ["Bold", "Italic", "Underline"],
    )}</ds-toggle-group><button>Link</button></ds-toolbar>`;
    await observed();

    button("Bold").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(button("Link")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(button("Bold")).toHaveFocus();
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    // One tab stop for the whole toolbar, the toolbar's.
    expect(
      Array.from(document.querySelectorAll("[role=toolbar] button")).filter(
        (el) => el.getAttribute("tabindex") === "0",
      ),
    ).toEqual([button("Bold")]);
  });
});
