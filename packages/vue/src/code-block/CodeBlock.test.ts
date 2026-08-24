import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CodeBlock } from "./CodeBlock";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

/** jsdom exposes `navigator.clipboard` as a getter, so it is redefined, not assigned. */
const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

describe("Vue CodeBlock", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  it("renders the source preformatted with a language caption", () => {
    render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    const pre = document.querySelector("pre.code-block__pre")!;
    expect(pre).toHaveTextContent("pnpm install");
    expect(screen.getByText("bash")).toBeInTheDocument();
  });

  it("labels the region with the language", () => {
    render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    expect(screen.getByRole("group", { name: "Code: bash" })).toBeInTheDocument();
  });

  it("copies the source to the clipboard when the copy button is pressed", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(CodeBlock, { props: { code: "echo hi" } });
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("echo hi");
  });

  it("omits the copy button when copyable is false", () => {
    render(CodeBlock, { props: { code: "pnpm install", copyable: false } });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders slotted markup in place of the plain source", () => {
    render(CodeBlock, {
      props: { code: "pnpm install" },
      slots: { default: () => "highlighted markup" },
    });
    expect(document.querySelector("pre.code-block__pre")).toHaveTextContent("highlighted markup");
  });

  it("exposes the scroller as a focusable, named group", () => {
    render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    const scroller = screen.getByRole("group", { name: "Code sample, bash" });
    expect(scroller).toBe(document.querySelector("pre.code-block__pre"));
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("names the scroller without a language too", () => {
    render(CodeBlock, { props: { code: "pnpm install", copyable: false } });
    expect(screen.getByRole("group", { name: "Code sample" })).toBeInTheDocument();
  });

  it("keeps two identical blocks off the landmark list", async () => {
    render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    expect(document.querySelectorAll("pre.code-block__pre")).toHaveLength(2);
    expect(document.querySelectorAll("[role=region]")).toHaveLength(0);
    expect(
      await axe(document.body, { runOnly: { type: "rule", values: ["landmark-unique"] } }),
    ).toHaveNoViolations();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(CodeBlock, { props: { code: "pnpm install", language: "bash" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
