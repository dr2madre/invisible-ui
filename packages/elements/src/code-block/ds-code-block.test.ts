import { screen } from "@testing-library/dom";
import { afterEach, beforeEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { DsCodeBlock } from "./ds-code-block";

// user-event installs its own clipboard, so the copy button is pressed with a
// plain click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  button.click();
  for (let tick = 0; tick < 3; tick++) await Promise.resolve();
};

// Only the duplicate-landmark rule: the others judge a whole page, not a
// fragment rendered on its own.
const landmarkRules = { runOnly: { type: "rule" as const, values: ["landmark-unique"] } };

const SOURCE = "pnpm install\npnpm build";

const mount = (attributes = "", code = SOURCE) => {
  document.body.innerHTML = `<main><ds-code-block ${attributes}></ds-code-block></main>`;
  const host = document.querySelector("ds-code-block") as DsCodeBlock;
  host.code = code;
  return host;
};

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("<ds-code-block>", () => {
  it("renders the source preformatted with a language caption", () => {
    mount('language="bash"');
    const pre = document.querySelector("pre.code-block__pre")!;
    expect(pre).toHaveTextContent("pnpm install");
    expect(pre.querySelector("code.code-block__code")!.textContent).toBe(SOURCE);
    expect(screen.getByText("bash")).toHaveClass("code-block__lang");
  });

  it("labels the region with the language", () => {
    mount('language="bash"');
    expect(screen.getByRole("group", { name: "Code: bash" })).toBeInTheDocument();
  });

  it("keeps a hostile code string as text", () => {
    const hostile = `<img src=x onerror="window.__pwned = true"><script>alert(1)</script>`;
    mount("", hostile);
    const code = document.querySelector("code.code-block__code")!;
    expect(code.querySelector("img, script")).toBeNull();
    expect(code.textContent).toBe(hostile);
  });

  it("copies the source to the clipboard when the copy button is pressed", async () => {
    mount("", "echo hi");
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("echo hi");
  });

  it("confirms the copy on the button and through a polite status", async () => {
    vi.useFakeTimers();
    mount();
    const button = screen.getByRole("button", { name: "Copy code" });
    expect(button).toHaveTextContent("Copy");
    expect(screen.getByRole("status")).toHaveTextContent("");
    await press(button);
    expect(button).toHaveTextContent("Copied");
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    vi.advanceTimersByTime(2000);
    expect(button).toHaveTextContent("Copy");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("announces nothing when the clipboard refuses", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    mount();
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.getByRole("button", { name: "Copy code" })).toHaveTextContent("Copy");
  });

  it("omits the copy button when copyable is false", () => {
    mount('copyable="false"');
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.querySelector(".code-block__header")).toBeNull();
  });

  it("takes a copy button name from copy-label", () => {
    mount('copy-label="Copy the install commands"');
    expect(screen.getByRole("button", { name: "Copy the install commands" })).toBeInTheDocument();
  });

  it("renders child markup in place of the plain source and copies its text", async () => {
    document.body.innerHTML = `<ds-code-block language="js"><span class="kw">const</span> a = 1;</ds-code-block>`;
    const code = document.querySelector("code.code-block__code")!;
    expect(code.querySelector("span.kw")).toHaveTextContent("const");
    await press(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("const a = 1;");
  });

  it("exposes the scroller as a focusable, named group", () => {
    mount('language="bash"');
    const scroller = screen.getByRole("group", { name: "Code sample, bash" });
    expect(scroller).toBe(document.querySelector("pre.code-block__pre"));
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("names the scroller without a language too", () => {
    mount('copyable="false"');
    expect(screen.getByRole("group", { name: "Code sample" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Code" })).toBeInTheDocument();
  });

  it("follows language and code changes", () => {
    const host = mount();
    host.setAttribute("language", "sh");
    expect(screen.getByRole("group", { name: "Code: sh" })).toBeInTheDocument();
    host.code = "ls -la";
    expect(document.querySelector("code.code-block__code")!.textContent).toBe("ls -la");
    host.removeAttribute("language");
    expect(screen.queryByText("sh")).toBeNull();
  });

  it("keeps two identical blocks off the landmark list", async () => {
    document.body.innerHTML = `<main>
      <ds-code-block language="bash" code="pnpm install"></ds-code-block>
      <ds-code-block language="bash" code="pnpm install"></ds-code-block>
    </main>`;
    expect(document.querySelectorAll("pre.code-block__pre")).toHaveLength(2);
    expect(document.querySelectorAll("[role=region]")).toHaveLength(0);
    expect(await axe(document.body, landmarkRules)).toHaveNoViolations();
  });

  it("localizes every default string, and copy-label still wins", async () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">
      <ds-code-block language="bash" code="ls"></ds-code-block>
    </ds-locale-provider>`;
    (document.querySelector("ds-locale-provider") as DsLocaleProvider).messages = {
      "codeBlock.copy": "Copia il codice",
      "codeBlock.copyText": "Copia",
      "codeBlock.copiedText": "Copiato",
      "codeBlock.copied": "Copiato negli appunti",
      "codeBlock.labelLanguage": "Codice: {language}",
      "codeBlock.sampleLanguage": "Esempio di codice, {language}",
    };
    expect(screen.getByRole("group", { name: "Codice: bash" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Esempio di codice, bash" })).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Copia il codice" });
    expect(button).toHaveTextContent("Copia");
    await press(button);
    expect(button).toHaveTextContent("Copiato");
    expect(screen.getByRole("status")).toHaveTextContent("Copiato negli appunti");

    document.querySelector("ds-code-block")!.setAttribute("copy-label", "Copia il comando");
    expect(screen.getByRole("button", { name: "Copia il comando" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount('language="bash"');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
