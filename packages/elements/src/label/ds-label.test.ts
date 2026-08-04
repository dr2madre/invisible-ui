import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";

const mount = (html: string) => {
  document.body.innerHTML = html;
};

describe("<ds-label>", () => {
  it("names the control it points at", () => {
    mount(`<ds-label for="email">Email</ds-label><input id="email" />`);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("focuses that control when pressed", async () => {
    const user = userEvent.setup();
    mount(`<ds-label for="email">Email</ds-label><input id="email" />`);

    await user.click(screen.getByText("Email"));

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("shows a required marker that screen readers skip", () => {
    mount(`<ds-label for="email" required>Email</ds-label><input id="email" />`);
    const marker = document.querySelector(".label__required")!;
    expect(marker).toHaveTextContent("*");
    expect(marker).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-label for="email">Email</ds-label><input id="email" />`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
