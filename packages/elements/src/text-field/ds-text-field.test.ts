import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsTextField } from "./ds-text-field";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-text-field, ds-textarea") as DsTextField;
};

describe("<ds-text-field>", () => {
  it("is a native input named by its label", () => {
    mount(`<ds-text-field label="Email"></ds-text-field>`);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.tagName).toBe("INPUT");
  });

  it("reports typed values through the property and a change event", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-text-field label="Email"></ds-text-field>`);
    const seen: string[] = [];
    host.addEventListener("input", (event) => seen.push((event as CustomEvent).detail.value));

    await user.type(screen.getByRole("textbox"), "ada");

    expect(host.value).toBe("ada");
    expect(seen.at(-1)).toBe("ada");
  });

  it("links the description and marks the error state", () => {
    mount(
      `<ds-text-field label="Email" description="We never share it." error="That is not an email."></ds-text-field>`,
    );
    const input = screen.getByRole("textbox");

    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedby = input.getAttribute("aria-describedby") ?? "";
    const described = describedby
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    expect(described).toContain("We never share it.");
    expect(described).toContain("That is not an email.");
  });

  it("marks required and disabled", () => {
    mount(`<ds-text-field label="Email" required disabled></ds-text-field>`);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-text-field label="Email" description="We never share it."></ds-text-field>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-textarea>", () => {
  it("is a native textarea named by its label", () => {
    mount(`<ds-textarea label="Notes" rows="3"></ds-textarea>`);
    const control = screen.getByRole("textbox", { name: "Notes" });
    expect(control.tagName).toBe("TEXTAREA");
    expect(control).toHaveAttribute("rows", "3");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-textarea label="Notes"></ds-textarea>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
