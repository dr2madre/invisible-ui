import { screen } from "@testing-library/dom";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsSeparator } from "./ds-separator";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-separator>", () => {
  it("is a semantic horizontal separator by default", () => {
    document.body.innerHTML = "<ds-separator></ds-separator>";
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("reacts to orientation and decorative changes", () => {
    const host = document.createElement("ds-separator") as DsSeparator;
    document.body.appendChild(host);
    host.setAttribute("orientation", "vertical");
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
    host.decorative = true;
    expect(screen.queryByRole("separator")).toBeNull();
    expect(host.firstElementChild).toHaveAttribute("role", "none");
    expect(host.firstElementChild).not.toHaveAttribute("aria-orientation");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = '<ds-separator orientation="vertical"></ds-separator>';
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
