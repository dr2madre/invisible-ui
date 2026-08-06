import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

const mount = (html: string) => {
  document.body.innerHTML = html;
};

describe("<ds-field>", () => {
  it("names the control the page supplies", () => {
    mount(`<ds-field label="Email"><input type="email" /></ds-field>`);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("links the description to the control", () => {
    mount(`<ds-field label="Email" description="We never share it."><input /></ds-field>`);
    const input = screen.getByRole("textbox");
    const described = (input.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    expect(described).toContain("We never share it.");
  });

  it("marks the control invalid and announces the error", () => {
    mount(`<ds-field label="Email" error="That is not an email."><input /></ds-field>`);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("That is not an email.")).toBeInTheDocument();
  });

  it("marks the control required", () => {
    mount(`<ds-field label="Email" required><input /></ds-field>`);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-required", "true");
  });

  it("keeps description before error however they were set", () => {
    mount(`<ds-field label="Email" error="Bad"><input /></ds-field>`);
    document.querySelector("ds-field")!.setAttribute("description", "Desc");
    const order = Array.from(document.querySelectorAll(".form-field > p")).map((p) => p.className);
    expect(order).toEqual(["field__description", "field__error"]);
  });

  it("works with a select as the control", () => {
    mount(
      `<ds-field label="Country"><select><option value="it">Italy</option></select></ds-field>`,
    );
    expect(screen.getByRole("combobox", { name: "Country" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-field label="Email" description="We never share it."><input /></ds-field>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
