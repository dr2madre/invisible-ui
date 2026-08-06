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

  it("the disabled and success state reach the root as modifier classes", () => {
    mount(`<ds-text-field label="Email" disabled success="Looks good"></ds-text-field>`);
    const root = document.querySelector(".text-field");
    expect(root).toHaveClass("text-field--disabled", "text-field--success");
  });

  it("the value attribute drives the control after the first render", () => {
    const host = mount(`<ds-text-field label="Email" value="ada"></ds-text-field>`) as DsTextField;
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("ada");

    host.setAttribute("value", "grace");
    expect(input.value).toBe("grace");
  });

  it("the error and success messages carry their icon", () => {
    mount(`<ds-text-field label="Email" error="Bad"></ds-text-field>`);
    expect(document.querySelector(".field__error .field__msg-icon")).not.toBeNull();

    mount(`<ds-text-field label="Email" success="Looks good"></ds-text-field>`);
    expect(document.querySelector(".field__success .field__msg-icon")).not.toBeNull();
  });

  it("keeps the message icon element across a sync the message didn't change", () => {
    const host = mount(`<ds-text-field label="Email" error="Bad"></ds-text-field>`);
    const icon = document.querySelector(".field__error .field__msg-icon");

    host.setAttribute("placeholder", "name@example.com");

    expect(document.querySelector(".field__error .field__msg-icon")).toBe(icon);
  });

  it("the description and error stay in reading order however they were set", () => {
    const host = mount(`<ds-text-field label="Email" error="Bad"></ds-text-field>`);
    host.setAttribute("description", "Desc");
    const order = Array.from(document.querySelectorAll(".text-field > p")).map((p) => p.className);
    expect(order).toEqual(["field__description", "field__error"]);
  });

  it("re-emits the native change as a typed CustomEvent", () => {
    const host = mount(`<ds-text-field label="Email"></ds-text-field>`);
    const input = document.querySelector("input") as HTMLInputElement;
    const seen: Event[] = [];
    host.addEventListener("change", (event) => seen.push(event));

    input.value = "ada";
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeInstanceOf(CustomEvent);
    expect((seen[0] as CustomEvent).detail.value).toBe("ada");
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

  // Its stylesheet is scoped under `.textarea`; rendering as `.text-field`
  // silently detached every rule in it, resize and drag grip included.
  it("roots itself on its own block class, not the text field's", () => {
    mount(`<ds-textarea label="Notes"></ds-textarea>`);
    expect(document.querySelector(".textarea")).not.toBeNull();
    expect(document.querySelector(".text-field")).toBeNull();
  });

  it("derives its state modifiers from the same block", () => {
    mount(`<ds-textarea label="Notes" disabled success="Looks good"></ds-textarea>`);
    expect(document.querySelector(".textarea")).toHaveClass(
      "textarea--disabled",
      "textarea--success",
    );
  });
});
