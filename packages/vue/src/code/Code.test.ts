import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Code } from "./Code";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Vue Code (inline)", () => {
  it("renders its content inside a <code> element", () => {
    const { container } = render(Code, { slots: { default: () => "npm install" } });
    const el = container.querySelector("code.code")!;
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("npm install");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Code, { slots: { default: () => "npm install" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
