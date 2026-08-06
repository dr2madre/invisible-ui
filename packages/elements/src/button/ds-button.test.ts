import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe("<ds-button>", () => {
  it("renders a native button with its children as the label", () => {
    mount(`<ds-button variant="primary">Save</ds-button>`);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("type", "button");
  });

  it("the type attribute drives the button after the first render", () => {
    mount(`<ds-button>Save</ds-button>`);
    const host = document.querySelector("ds-button")!;
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");

    host.setAttribute("type", "submit");
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("clicks like a native button and honours disabled", async () => {
    const user = userEvent.setup();
    mount(`<ds-button>Save</ds-button>`);
    const host = document.querySelector("ds-button")!;
    const onClick = vi.fn();
    host.addEventListener("click", onClick);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();

    onClick.mockClear();
    host.setAttribute("disabled", "");
    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the hazard icon on danger so meaning is not colour-only", () => {
    mount(`<ds-button variant="danger">Delete</ds-button>`);
    expect(document.querySelector(".button__icon")).not.toBeNull();
  });

  it("the icon attributes drive the glyphs after the first render", () => {
    mount(`<ds-button>Save</ds-button>`);
    const host = document.querySelector("ds-button")!;
    const button = screen.getByRole("button");
    expect(button.querySelectorAll(".button__icon")).toHaveLength(0);

    host.setAttribute("left-icon", "");
    host.setAttribute("right-icon", "");
    expect(button.querySelectorAll(".button__icon")).toHaveLength(2);
    expect(button.firstElementChild).toHaveClass("button__icon");
    expect(button.lastElementChild).toHaveClass("button__icon");

    host.removeAttribute("left-icon");
    host.removeAttribute("right-icon");
    expect(button.querySelectorAll(".button__icon")).toHaveLength(0);
  });

  it("keeps the label intact while the icons come and go", () => {
    mount(`<ds-button>Save</ds-button>`);
    const host = document.querySelector("ds-button")!;

    host.setAttribute("left-icon", "");
    host.setAttribute("right-icon", "");
    host.removeAttribute("left-icon");

    expect(screen.getByRole("button")).toHaveTextContent("Save");
  });

  it("the icon-only attribute drives the modifier after the first render", () => {
    mount(`<ds-button>Save</ds-button>`);
    const host = document.querySelector("ds-button")!;
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("button--icon-only");

    host.setAttribute("icon-only", "");
    expect(button).toHaveClass("button--icon-only");
  });

  it("the aria-label attribute reaches the button after the first render", () => {
    mount(`<ds-button icon-only><svg></svg></ds-button>`);
    const host = document.querySelector("ds-button")!;

    host.setAttribute("aria-label", "Close");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    // Moved, not copied: the host must not keep announcing it too.
    expect(host).not.toHaveAttribute("aria-label");
  });

  it("forwards aria-label for icon-only buttons", () => {
    mount(`<ds-button icon-only aria-label="Close"><svg></svg></ds-button>`);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("button--icon-only");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-button>Save</ds-button>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
