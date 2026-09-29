import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Button } from "./Button";

// A copy confirmation next to the control that caused it (ADR 0016).

// user-event installs its own clipboard, so the button is pressed with a plain
// click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  await act(async () => {
    button.click();
    for (let tick = 0; tick < 3; tick++) await Promise.resolve();
  });
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
});

const status = () => document.querySelector<HTMLElement>(".button__status");

describe("Button copy", () => {
  it("keeps an empty live region beside the button before any copy", async () => {
    render(<Button copy={LINK}>Copy link</Button>);
    const button = screen.getByRole("button", { name: "Copy link" });
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
    render(<Button copy={LINK}>Copy link</Button>);
    const button = screen.getByRole("button", { name: "Copy link" });
    button.focus();
    await press(button);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(status()).toHaveTextContent("Copied");
    expect(button).toHaveAccessibleName("Copy link");
    expect(button).toHaveFocus();

    act(() => vi.advanceTimersByTime(1999));
    expect(status()).toHaveTextContent("Copied");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toBeEmptyDOMElement();
  });

  it("copies the current value and still runs onPress", async () => {
    const onPress = vi.fn();
    const { rerender } = render(
      <Button copy={LINK} onPress={onPress}>
        Copy link
      </Button>,
    );
    rerender(
      <Button copy="https://example.com/f/2" onPress={onPress}>
        Copy link
      </Button>,
    );
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith("https://example.com/f/2");
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when the clipboard refuses or is missing", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<Button copy={LINK}>Copy link</Button>);
    const button = screen.getByRole("button", { name: "Copy link" });
    await press(button);
    expect(status()).toBeEmptyDOMElement();

    stubClipboard(undefined);
    await press(button);
    expect(status()).toBeEmptyDOMElement();
  });

  it("takes the confirmation from copiedLabel or the locale provider", async () => {
    const { unmount } = render(
      <Button copy={LINK} copiedLabel="Link copied">
        Copy link
      </Button>,
    );
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(status()).toHaveTextContent("Link copied");
    unmount();

    render(
      <LocaleProvider locale="it" messages={{ "button.copied": "Copiato" }}>
        <Button copy={LINK}>Copia link</Button>
      </LocaleProvider>,
    );
    await press(screen.getByRole("button", { name: "Copia link" }));
    expect(status()).toHaveTextContent("Copiato");
  });

  it("leaves no timer behind when the button goes away before the copy ends", async () => {
    vi.useFakeTimers();
    let finish = () => {};
    writeText.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { unmount } = render(<Button copy={LINK}>Copy link</Button>);
    screen.getByRole("button", { name: "Copy link" }).click();
    unmount();
    await act(async () => {
      finish();
      for (let tick = 0; tick < 3; tick++) await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("is a plain button without copy", async () => {
    render(<Button>Copy link</Button>);
    await press(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toBeNull();
  });
});
