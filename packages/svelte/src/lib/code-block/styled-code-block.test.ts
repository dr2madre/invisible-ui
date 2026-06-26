import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./code-block.fixture.svelte";

describe("Svelte CodeBlock (styled)", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders the source preformatted with a language caption", () => {
    render(Fixture, { props: { language: "bash" } });
    const pre = document.querySelector("pre.code-block__pre")!;
    expect(pre).toHaveTextContent("pnpm install");
    expect(screen.getByText("bash")).toBeInTheDocument();
  });

  it("labels the region with the language", () => {
    render(Fixture, { props: { language: "bash" } });
    expect(screen.getByRole("group", { name: "Code: bash" })).toBeInTheDocument();
  });

  it("copies the source to the clipboard when the copy button is pressed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(Fixture, { props: { code: "echo hi" } });
    await fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("echo hi");
  });

  it("omits the copy button when copyable is false", () => {
    render(Fixture, { props: { copyable: false, language: undefined } });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { language: "bash" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
