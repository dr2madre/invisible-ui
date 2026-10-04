import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { CodeBlock } from "./CodeBlock";

// Only the duplicate-landmark rule: the others judge a whole page, not a
// fragment rendered on its own.
const landmarkRules = { runOnly: { type: "rule" as const, values: ["landmark-unique"] } };

// user-event installs its own clipboard, so the button is pressed with a plain
// click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  await act(async () => {
    button.click();
    for (let tick = 0; tick < 3; tick++) await Promise.resolve();
  });
};

let writeText: ReturnType<typeof vi.fn>;
const stubClipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  stubClipboard({ writeText });
});

afterEach(() => {
  vi.useRealTimers();
});

const SOURCE = "pnpm install\npnpm test";

describe("React CodeBlock", () => {
  it("renders the source preformatted with a language caption", () => {
    render(<CodeBlock code={SOURCE} language="bash" />);
    const code = document.querySelector("pre.code-block__pre code.code-block__code")!;
    expect(code.textContent).toBe(SOURCE);
    expect(screen.getByText("bash")).toHaveClass("code-block__lang");
  });

  it("renders the source as text, never as markup", () => {
    render(<CodeBlock code="<b>bold</b>" copyable={false} />);
    expect(document.querySelector("b")).toBeNull();
    expect(document.querySelector("code")).toHaveTextContent("<b>bold</b>");
  });

  it("labels the block with the language", () => {
    render(<CodeBlock code={SOURCE} language="bash" />);
    expect(screen.getByRole("group", { name: "Code: bash" })).toBeInTheDocument();
  });

  it("copies the source when the copy button is pressed", async () => {
    render(<CodeBlock code="echo hi" />);
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("echo hi");
  });

  it("copies the source while showing highlighted children", async () => {
    render(
      <CodeBlock code="echo hi">
        <span className="token">echo</span> hi
      </CodeBlock>,
    );
    expect(document.querySelector("code .token")).toHaveTextContent("echo");
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("echo hi");
  });

  it("confirms a copy for two seconds through the shared copy logic", async () => {
    vi.useFakeTimers();
    render(<CodeBlock code="echo hi" />);
    const button = screen.getByRole("button", { name: "Copy code" });
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await press(button);
    expect(button).toHaveTextContent("Copied");
    expect(status).toHaveTextContent("Copied to clipboard");

    act(() => vi.advanceTimersByTime(2000));
    expect(button).toHaveTextContent("Copy");
    expect(status).toBeEmptyDOMElement();
  });

  it("announces nothing when the page has no clipboard", async () => {
    stubClipboard(undefined);
    render(<CodeBlock code="echo hi" />);
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("omits the copy button when copyable is false", () => {
    render(<CodeBlock code={SOURCE} copyable={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("figcaption")).toBeNull();
  });

  it("exposes the scroller as a focusable, named group", () => {
    render(<CodeBlock code={SOURCE} language="bash" />);
    const scroller = screen.getByRole("group", { name: "Code sample, bash" });
    expect(scroller).toBe(document.querySelector("pre.code-block__pre"));
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("names the block and the scroller without a language too", () => {
    render(<CodeBlock code={SOURCE} copyable={false} />);
    expect(screen.getByRole("group", { name: "Code" })).toHaveClass("code-block");
    expect(screen.getByRole("group", { name: "Code sample" })).toBeInTheDocument();
  });

  it("takes its labels from the catalog, or from copyLabel", () => {
    const { unmount } = render(
      <LocaleProvider
        locale="it"
        messages={{
          "codeBlock.copy": "Copia codice",
          "codeBlock.copyText": "Copia",
          "codeBlock.labelLanguage": "Codice: {language}",
          "codeBlock.sampleLanguage": "Esempio di codice, {language}",
        }}
      >
        <CodeBlock code={SOURCE} language="bash" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("group", { name: "Codice: bash" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Esempio di codice, bash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copia codice" })).toHaveTextContent("Copia");
    unmount();
    render(<CodeBlock code={SOURCE} copyLabel="Copy the install command" />);
    expect(screen.getByRole("button", { name: "Copy the install command" })).toBeInTheDocument();
  });

  it("keeps two identical blocks off the landmark list", async () => {
    render(
      <>
        <CodeBlock code={SOURCE} language="bash" />
        <CodeBlock code={SOURCE} language="bash" />
      </>,
    );
    expect(document.querySelectorAll("pre.code-block__pre")).toHaveLength(2);
    expect(document.querySelectorAll("[role=region]")).toHaveLength(0);
    expect(await axe(document.body, landmarkRules)).toHaveNoViolations();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CodeBlock code={SOURCE} language="bash" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
