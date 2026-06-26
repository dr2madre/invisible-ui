import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./code.fixture.svelte";

describe("Code (inline)", () => {
  it("renders its content inside a <code> element", () => {
    const { container } = render(Fixture);
    const el = container.querySelector("code.code")!;
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("npm install");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
