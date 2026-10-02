import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./button-copy.fixture.svelte";

// A copy confirmation next to the control that caused it (ADR 0016).

// user-event installs its own clipboard, so the button is pressed with a plain
// click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  await fireEvent.click(button);
  for (let step = 0; step < 3; step++) await Promise.resolve();
  await tick();
};

const LINK = "https://example.com/f/1";
let writeText: ReturnType<typeof vi.fn>;

const stubClipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { configurable: true, writable: true, value });

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  stubClipboard({ writeText });
});

afterEach(() => {
  vi.useRealTimers();
});

const status = () => document.querySelector<HTMLElement>(".button__status");

describe("Svelte Button copy", () => {
  it("keeps an empty live region beside the button before any copy", async () => {
    const { container } = render(Fixture, { props: { copy: LINK } });
    const button = screen.getByRole("button", { name: "Copy link" });
    const region = status()!;
    expect(region).toHaveAttribute("role", "status");
    expect(region?.textContent?.trim()).toBe("");
    // Beside the button, never inside it: the name stays "Copy link".
    expect(button).not.toContainElement(region);
    expect(button.nextElementSibling).toBe(region);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("copies, confirms beside the button for two seconds, and keeps the name and focus", async () => {
    vi.useFakeTimers();
    render(Fixture, { props: { copy: LINK } });
    const button = screen.getByRole("button", { name: "Copy link" });
    button.focus();
    await press(button);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(status()).toHaveTextContent("Copied");
    expect(button).toHaveAccessibleName("Copy link");
    expect(button).toHaveFocus();

    vi.advanceTimersByTime(1999);
    await tick();
    expect(status()).toHaveTextContent("Copied");
    vi.advanceTimersByTime(1);
    await tick();
    expect(status()?.textContent?.trim()).toBe("");
  });

  it("copies the current value of the prop", async () => {
    const { rerender } = render(Fixture, { props: { copy: LINK } });
    await rerender({ copy: "https://example.com/f/2" });
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith("https://example.com/f/2");
  });

  it("shows nothing when the clipboard refuses or is missing", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(Fixture, { props: { copy: LINK } });
    const button = screen.getByRole("button", { name: "Copy link" });
    await press(button);
    expect(status()?.textContent?.trim()).toBe("");

    stubClipboard(undefined);
    await press(button);
    expect(status()?.textContent?.trim()).toBe("");
  });

  it("takes the confirmation from copiedLabel", async () => {
    render(Fixture, { props: { copy: LINK, copiedLabel: "Link copied" } });
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(status()).toHaveTextContent("Link copied");
  });

  it("takes the confirmation from the locale provider", async () => {
    render(Fixture, { props: { copy: LINK, messages: { "button.copied": "Copiato" } } });
    await press(screen.getByRole("button", { name: "Copia link" }));
    expect(status()).toHaveTextContent("Copiato");
  });

  it("is a plain button without copy", async () => {
    render(Fixture);
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toBeNull();
  });
});
