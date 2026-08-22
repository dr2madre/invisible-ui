import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./code-block.fixture.svelte";

// Only the duplicate-landmark rule: the others judge a whole page, not a
// fragment rendered on its own.
const landmarkRules = { runOnly: { type: "rule", values: ["landmark-unique"] } };

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

  it("exposes the scroller as a focusable, named group", () => {
    render(Fixture, { props: { language: "bash" } });
    const scroller = screen.getByRole("group", { name: "Code sample, bash" });
    expect(scroller).toBe(document.querySelector("pre.code-block__pre"));
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("names the scroller without a language too", () => {
    render(Fixture, { props: { language: undefined, copyable: false } });
    expect(screen.getByRole("group", { name: "Code sample" })).toBeInTheDocument();
  });

  it("keeps two identical blocks off the landmark list", async () => {
    const { container } = render(Fixture, { props: { language: "bash" } });
    render(Fixture, { props: { language: "bash" } });
    expect(document.querySelectorAll("pre.code-block__pre")).toHaveLength(2);
    expect(document.querySelectorAll("[role=region]")).toHaveLength(0);
    expect(await axe(container.ownerDocument.body, landmarkRules)).toHaveNoViolations();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { language: "bash" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
