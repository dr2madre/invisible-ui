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

  it("forwards aria-label for icon-only buttons", () => {
    mount(`<ds-button icon-only aria-label="Close"><svg></svg></ds-button>`);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("button--icon-only");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-button>Save</ds-button>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
