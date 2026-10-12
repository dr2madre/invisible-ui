import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PinInput } from "../pin-input/PinInput";
import { RangeSlider } from "../range-slider/RangeSlider";
import { RatingGroup } from "../rating-group/RatingGroup";
import { Slider } from "../slider/Slider";
import { ToggleButton } from "../toggle-button/ToggleButton";

type Case = {
  name: string;
  /** Whether the focusable controls take `aria-invalid` with the error. */
  invalid: boolean;
  element: (error?: string) => ReactElement;
};

const cases: Case[] = [
  {
    name: "Slider",
    invalid: true,
    element: (error) => <Slider label="Volume" value={30} error={error} />,
  },
  {
    name: "RangeSlider",
    invalid: true,
    element: (error) => (
      <RangeSlider label="Price" thumbLabels={["Minimum", "Maximum"]} error={error} />
    ),
  },
  {
    name: "PinInput",
    invalid: true,
    element: (error) => <PinInput label="Code" length={3} error={error} />,
  },
  {
    name: "RatingGroup",
    invalid: false,
    element: (error) => <RatingGroup label="Rating" max={3} error={error} />,
  },
  {
    name: "ToggleButton",
    invalid: false,
    element: (error) => (
      <ToggleButton label="Bold" error={error}>
        B
      </ToggleButton>
    ),
  },
];

/** Every control a user can focus: the inputs that are not hidden. */
const controls = (root: ParentNode) => [...root.querySelectorAll("input:not([type=hidden])")];

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe.each(cases)("React $name error", ({ name, invalid, element }) => {
  it("shows the message as an alert that describes every control", () => {
    const { container } = render(element("Pick a value"));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Pick a value");
    expect(alert).toHaveClass("field__error", "field__message");
    expect(alert.querySelector(".field__msg-icon svg")).not.toBeNull();
    for (const control of controls(container)) {
      expect(control).toHaveAttribute("aria-describedby", alert.id);
    }
  });

  it(`puts aria-invalid ${invalid ? "on the controls only" : "nowhere"}`, () => {
    const { container } = render(element("Pick a value"));
    expect([...container.querySelectorAll("[aria-invalid]")]).toEqual(
      invalid ? controls(container) : [],
    );
  });

  it("removes the message and its references once cleared", () => {
    const { container, rerender } = render(element("Pick a value"));
    rerender(element(undefined));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.querySelector("[aria-describedby], [aria-invalid]")).toBeNull();
    rerender(element(""));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the message through a form reset", () => {
    const { container } = render(<form>{element("Pick a value")}</form>);
    act(() => container.querySelector("form")!.reset());
    expect(screen.getByRole("alert")).toHaveTextContent("Pick a value");
  });

  it("renders the message on the server and hydrates without mismatches", async () => {
    const html = renderToString(element("Pick a value"));
    expect(html).toContain('role="alert"');
    document.body.innerHTML = `<div id="app">${html}</div>`;
    const host = document.querySelector<HTMLElement>("#app")!;
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root: Root | undefined;
    await act(async () => {
      root = hydrateRoot(host, element("Pick a value"), { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    const alert = host.querySelector('[role="alert"]')!;
    for (const control of controls(host)) {
      expect(control).toHaveAttribute("aria-describedby", alert.id);
    }
    await act(async () => root?.unmount());
  });

  it("has no accessibility violations with the message", async () => {
    const { container } = render(element("Pick a value"));
    expect(await axe(container), name).toHaveNoViolations();
  });
});

describe("React PinInput error", () => {
  it("marks the input invalid the way `invalid` does", () => {
    const { container } = render(<PinInput label="Code" length={2} error="Wrong code" success />);
    const root = container.querySelector(".pin-input");
    expect(root).toHaveAttribute("data-invalid");
    expect(root).not.toHaveAttribute("data-success");
  });
});
