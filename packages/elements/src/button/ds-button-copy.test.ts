import { screen } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";

// A copy confirmation next to the control that caused it (ADR 0016).

// user-event installs its own clipboard, so the button is pressed with a plain
// click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  button.click();
  for (let tick = 0; tick < 3; tick++) await Promise.resolve();
};

const LINK = "https://example.com/f/1";
let writeText: ReturnType<typeof vi.fn>;

const stubClipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  stubClipboard({ writeText });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

const mount = (attributes = `copy="${LINK}"`) => {
  document.body.innerHTML = `<ds-button ${attributes}>Copy link</ds-button>`;
  return screen.getByRole("button", { name: "Copy link" });
};

const status = () => document.querySelector<HTMLElement>(".button__status");

describe("<ds-button copy>", () => {
  it("keeps an empty live region beside the button before any copy", async () => {
    const button = mount();
    const region = status()!;
    expect(region).toHaveAttribute("role", "status");
    expect(region).toBeEmptyDOMElement();
    // Beside the button, never inside it: the name stays "Copy link".
    expect(button).not.toContainElement(region);
    expect(button.nextElementSibling).toBe(region);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("copies, confirms beside the button for two seconds, and keeps the name and focus", async () => {
    vi.useFakeTimers();
    const button = mount();
    button.focus();
    await press(button);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(status()).toHaveTextContent("Copied");
    expect(button).toHaveAccessibleName("Copy link");
    expect(button).toHaveFocus();

    vi.advanceTimersByTime(1999);
    expect(status()).toHaveTextContent("Copied");
    vi.advanceTimersByTime(1);
    expect(status()).toBeEmptyDOMElement();
  });

  it("copies the current value of the attribute", async () => {
    const button = mount();
    button.closest("ds-button")!.setAttribute("copy", "https://example.com/f/2");
    await press(button);
    expect(writeText).toHaveBeenCalledWith("https://example.com/f/2");
  });

  it("shows nothing when the clipboard refuses or is missing", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const button = mount();
    await press(button);
    expect(status()).toBeEmptyDOMElement();

    stubClipboard(undefined);
    await press(button);
    expect(status()).toBeEmptyDOMElement();
  });

  it("takes the confirmation from copied-label or the locale provider", async () => {
    const button = mount(`copy="${LINK}" copied-label="Link copied"`);
    await press(button);
    expect(status()).toHaveTextContent("Link copied");

    document.body.innerHTML = `
      <ds-locale-provider locale="it"><ds-button copy="${LINK}">Copia link</ds-button></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "button.copied": "Copiato" };
    await press(screen.getByRole("button", { name: "Copia link" }));
    expect(status()).toHaveTextContent("Copiato");
  });

  it("is a plain button without copy", async () => {
    const button = mount("");
    await press(button);
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toBeNull();
  });
});
