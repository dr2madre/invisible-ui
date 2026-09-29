import { render, screen } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Button } from "./Button";

// A copy confirmation next to the control that caused it (ADR 0016).

// user-event installs its own clipboard, so the button is pressed with a plain
// click and the stub below stays in place.
const press = async (button: HTMLElement) => {
  button.click();
  for (let tick = 0; tick < 3; tick++) await Promise.resolve();
  await nextTick();
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

const mount = (props: Record<string, unknown> = { copy: LINK }) => {
  const result = render(Button, { props, slots: { default: () => "Copy link" } });
  return { ...result, button: screen.getByRole("button", { name: "Copy link" }) };
};

const status = () => document.querySelector<HTMLElement>(".button__status");

describe("Vue Button with copy", () => {
  it("keeps an empty live region beside the button before any copy", async () => {
    const { button } = mount();
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
    const onPress = vi.fn();
    const { button } = mount({ copy: LINK, onPress });
    button.focus();
    await press(button);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent("Copied");
    expect(button).toHaveAccessibleName("Copy link");
    expect(button).toHaveFocus();

    vi.advanceTimersByTime(1999);
    await nextTick();
    expect(status()).toHaveTextContent("Copied");
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(status()).toBeEmptyDOMElement();
  });

  it("copies the current value of the prop", async () => {
    const { button, rerender } = mount();
    await rerender({ copy: "https://example.com/f/2" });
    await press(button);
    expect(writeText).toHaveBeenCalledWith("https://example.com/f/2");
  });

  it("shows nothing when the clipboard refuses or is missing", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const { button } = mount();
    await press(button);
    expect(status()).toBeEmptyDOMElement();

    stubClipboard(undefined);
    await press(button);
    expect(status()).toBeEmptyDOMElement();
  });

  it("takes the confirmation from copiedLabel or the locale provider", async () => {
    const { button, unmount } = mount({ copy: LINK, copiedLabel: "Link copied" });
    await press(button);
    expect(status()).toHaveTextContent("Link copied");
    unmount();

    render(
      defineComponent({
        setup: () => () =>
          h(
            LocaleProvider,
            { locale: "it", messages: { "button.copied": "Copiato" } },
            { default: () => h(Button, { copy: LINK }, { default: () => "Copia link" }) },
          ),
      }),
    );
    await press(screen.getByRole("button", { name: "Copia link" }));
    expect(status()).toHaveTextContent("Copiato");
  });

  it("is a plain button without copy", async () => {
    const { button } = mount({});
    await press(button);
    expect(writeText).not.toHaveBeenCalled();
    expect(status()).toBeNull();
  });

  it("still gives extra attributes and listeners to the button", async () => {
    const onClick = vi.fn();
    const visible = ref(true);
    render(
      defineComponent({
        setup: () => () =>
          h(
            Button,
            {
              copy: LINK,
              class: "share-copy",
              "aria-controls": "share-panel",
              "data-state": visible.value ? "open" : "closed",
              onClick,
            },
            { default: () => "Copy link" },
          ),
      }),
    );
    const button = screen.getByRole("button", { name: "Copy link" });
    expect(button).toHaveClass("button", "share-copy");
    expect(button).toHaveAttribute("aria-controls", "share-panel");
    expect(button).toHaveAttribute("data-state", "open");
    await press(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(status()).not.toHaveAttribute("aria-controls");
  });
});
