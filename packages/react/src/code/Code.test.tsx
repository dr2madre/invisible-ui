import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Code } from "./Code";

describe("React Code", () => {
  it("renders its content inside a <code> element", () => {
    const { container } = render(
      <p>
        Run <Code>pnpm install</Code> first.
      </p>,
    );
    const code = container.querySelector("code.code")!;
    expect(code).toHaveTextContent("pnpm install");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Code>npm test</Code>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
