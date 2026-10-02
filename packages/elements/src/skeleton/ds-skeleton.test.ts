import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

const root = () => document.querySelector<HTMLElement>(".skeleton")!;
const bars = () => Array.from(root().querySelectorAll<HTMLElement>(".skeleton__bar"));

describe("<ds-skeleton>", () => {
  it("is decorative, hidden from assistive technology, by default", () => {
    document.body.innerHTML = `<ds-skeleton></ds-skeleton>`;
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).toHaveAttribute("data-variant", "text");
    expect(root()).toHaveAttribute("data-animation", "pulse");
    expect(root()).not.toHaveAttribute("role");
  });

  it("renders one bar per line for the text variant, the last one shorter", () => {
    document.body.innerHTML = `<ds-skeleton variant="text" lines="3" width="12rem"></ds-skeleton>`;
    const lines = root().querySelectorAll<HTMLElement>(".skeleton__line");
    expect(lines).toHaveLength(3);
    expect(lines[0]!.style.width).toBe("12rem");
    expect(lines[2]!.style.width).toBe("60%");
  });

  it("renders a single circle whose height follows its width", () => {
    document.body.innerHTML = `<ds-skeleton variant="circle" width="3rem"></ds-skeleton>`;
    expect(bars()).toHaveLength(1);
    expect(bars()[0]).toHaveClass("skeleton__circle");
    expect(bars()[0]!.style.height).toBe("3rem");
  });

  it("sizes a rect and applies the radius", () => {
    document.body.innerHTML = `<ds-skeleton variant="rect" width="100%" height="8rem" radius="0"></ds-skeleton>`;
    const [bar] = bars();
    expect(bar).not.toHaveClass("skeleton__circle");
    expect(bar!.style.height).toBe("8rem");
    expect(bar!.style.borderRadius).toBe("0px");
  });

  it("becomes a polite status with an accessible name when labelled", () => {
    document.body.innerHTML = `<ds-skeleton label="Loading profile"></ds-skeleton>`;
    const status = screen.getByRole("status", { name: "Loading profile" });
    expect(status).toBe(root());
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).not.toHaveAttribute("aria-hidden");

    document.querySelector("ds-skeleton")!.removeAttribute("label");
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).not.toHaveAttribute("role");
  });

  it("reflects the animation mode and ignores an unknown one", () => {
    document.body.innerHTML = `<ds-skeleton animation="wave"></ds-skeleton>`;
    expect(root()).toHaveAttribute("data-animation", "wave");
    document.querySelector("ds-skeleton")!.setAttribute("animation", "spin");
    expect(root()).toHaveAttribute("data-animation", "pulse");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `<ds-skeleton label="Loading"></ds-skeleton><ds-skeleton variant="circle"></ds-skeleton>`;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
