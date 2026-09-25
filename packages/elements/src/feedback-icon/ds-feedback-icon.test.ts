import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };
const statuses = ["info", "success", "warning", "danger", "neutral"] as const;

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-feedback-icon") as HTMLElement;
};
const box = () => document.querySelector(".feedback-icon")!;

describe("<ds-feedback-icon>", () => {
  it("defaults to the info status and renders a built-in icon", () => {
    mount(`<ds-feedback-icon></ds-feedback-icon>`);
    expect(box()).toHaveAttribute("data-status", "info");
    expect(box()).toHaveAttribute("data-box", "tint");
    expect(box()).toHaveAttribute("data-shape", "rounded");
    expect(box().querySelector("svg")).toBeInTheDocument();
  });

  it.each(statuses)("renders the %s status", (status) => {
    mount(`<ds-feedback-icon status="${status}"></ds-feedback-icon>`);
    expect(box()).toHaveAttribute("data-status", status);
    expect(box().querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to info for an unknown status", () => {
    mount(`<ds-feedback-icon status="loud"></ds-feedback-icon>`);
    expect(box()).toHaveAttribute("data-status", "info");
  });

  it("is decorative (aria-hidden) without a label", () => {
    mount(`<ds-feedback-icon status="warning"></ds-feedback-icon>`);
    expect(box()).toHaveAttribute("aria-hidden", "true");
    expect(box()).not.toHaveAttribute("role");
  });

  it("is exposed as an image with a name when labelled", () => {
    mount(`<ds-feedback-icon status="danger" label="Error"></ds-feedback-icon>`);
    const img = screen.getByRole("img", { name: "Error" });
    expect(img).toHaveAttribute("data-status", "danger");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("follows status, box, shape and label changes", () => {
    const host = mount(`<ds-feedback-icon label="Note"></ds-feedback-icon>`);
    host.setAttribute("status", "success");
    host.setAttribute("box", "solid");
    host.setAttribute("shape", "round");
    expect(box()).toHaveAttribute("data-status", "success");
    expect(box()).toHaveAttribute("data-box", "solid");
    expect(box()).toHaveAttribute("data-shape", "round");
    expect(box().querySelectorAll("svg")).toHaveLength(1);
    host.removeAttribute("label");
    expect(box()).toHaveAttribute("aria-hidden", "true");
    expect(box()).not.toHaveAttribute("aria-label");
  });

  it("renders a custom icon passed as a child instead of the default", () => {
    mount(
      `<ds-feedback-icon status="success" label="Custom">
        <svg data-testid="custom-icon" viewBox="0 0 24 24"></svg>
      </ds-feedback-icon>`,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(document.querySelectorAll("svg")).toHaveLength(1);
  });

  it("keeps the label as text", () => {
    mount(`<ds-feedback-icon label="<b>Error</b>"></ds-feedback-icon>`);
    expect(box().querySelector("b")).toBeNull();
    expect(screen.getByRole("img", { name: "<b>Error</b>" })).toBeInTheDocument();
  });

  it("has no accessibility violations (labelled and decorative)", async () => {
    mount(
      `<main>
        <ds-feedback-icon status="info" label="Information"></ds-feedback-icon>
        <ds-feedback-icon status="neutral"></ds-feedback-icon>
      </main>`,
    );
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
