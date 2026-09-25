import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-icon")!;
};

const svg = () => document.querySelector<SVGSVGElement>("svg.icon")!;

describe("<ds-icon>", () => {
  it("is decorative by default (hidden from assistive tech)", () => {
    mount(`<ds-icon path="M20 6 9 17l-5-5"></ds-icon>`);
    expect(svg()).toHaveAttribute("aria-hidden", "true");
    expect(svg()).not.toHaveAttribute("role");
    expect(svg()).toHaveAttribute("stroke", "currentColor");
    expect(svg()).toHaveAttribute("width", "1em");
    expect(svg()).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg().querySelector("path")).toHaveAttribute("d", "M20 6 9 17l-5-5");
  });

  it("becomes a labelled image when given a label", () => {
    const host = mount(`<ds-icon path="M20 6 9 17l-5-5" label="Done"></ds-icon>`);
    expect(screen.getByRole("img", { name: "Done" })).not.toHaveAttribute("aria-hidden");

    host.removeAttribute("label");
    expect(screen.queryByRole("img")).toBeNull();
    expect(svg()).toHaveAttribute("aria-hidden", "true");
  });

  it("applies a custom size and stroke width", () => {
    mount(`<ds-icon path="M20 6 9 17l-5-5" size="2rem" stroke-width="3"></ds-icon>`);
    expect(svg()).toHaveAttribute("width", "2rem");
    expect(svg()).toHaveAttribute("height", "2rem");
    expect(svg()).toHaveAttribute("stroke-width", "3");
  });

  it("adopts the shapes and viewBox of a child svg", () => {
    mount(
      `<ds-icon><svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14" /></svg></ds-icon>`,
    );
    expect(document.querySelectorAll("svg")).toHaveLength(1);
    expect(svg()).toHaveAttribute("viewBox", "0 0 16 16");
    expect(svg().querySelector("line")).not.toBeNull();
  });

  it("keeps a hostile path as attribute data", () => {
    mount(`<ds-icon></ds-icon>`);
    document.querySelector("ds-icon")!.setAttribute("path", `"/><script>alert(1)</script>`);
    expect(document.querySelector("script")).toBeNull();
    expect(svg().querySelector("path")).toHaveAttribute("d", `"/><script>alert(1)</script>`);
  });

  it("has no accessibility violations", async () => {
    mount(`<p>Saved <ds-icon path="M20 6 9 17l-5-5" label="Done"></ds-icon></p>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
