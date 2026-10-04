import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Label } from "./Label";
import { useLabel } from "./use-label";

function Fixture({ htmlFor = "name", required = false }: { htmlFor?: string; required?: boolean }) {
  return (
    <>
      <Label htmlFor={htmlFor} required={required}>
        Full name
      </Label>
      <input id="name" type="text" />
      <input id="nickname" type="text" aria-label="Nickname" />
    </>
  );
}

function HeadlessFixture() {
  const { rootProps } = useLabel({ htmlFor: "email", id: "email-label" });
  return (
    <>
      <label {...rootProps}>Email</label>
      <input id="email" type="email" />
    </>
  );
}

describe("React Label", () => {
  it("labels the control and focuses it on click", async () => {
    render(<Fixture />);
    const input = screen.getByLabelText("Full name");
    expect(input).toHaveAttribute("id", "name");
    await userEvent.click(screen.getByText("Full name"));
    expect(input).toHaveFocus();
  });

  it("shows a required marker hidden from assistive tech", () => {
    render(<Fixture required />);
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector("label.label")).toHaveAttribute("for", "name");
    expect(screen.getByRole("textbox", { name: "Full name" })).toHaveAttribute("id", "name");
  });

  it("follows an htmlFor changed after mount", () => {
    const { rerender } = render(<Fixture />);
    rerender(<Fixture htmlFor="nickname" />);
    expect(screen.getByLabelText("Full name")).toHaveAttribute("id", "nickname");
  });

  it("keeps a double click from selecting the label text", () => {
    render(<Fixture />);
    const label = screen.getByText("Full name");
    expect(fireEvent.mouseDown(label, { detail: 1 })).toBe(true);
    expect(fireEvent.mouseDown(label, { detail: 2 })).toBe(false);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture required />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("useLabel (headless)", () => {
  it("associates the label with its control and gives it an id", async () => {
    render(<HeadlessFixture />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
    expect(label).toHaveAttribute("id", "email-label");
    await userEvent.click(label);
    expect(screen.getByLabelText("Email")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<HeadlessFixture />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
