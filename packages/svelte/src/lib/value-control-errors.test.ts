import { render, screen } from "@testing-library/svelte";
import type { Component } from "svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import PinInput from "./pin-input/PinInput.svelte";
import RangeSlider from "./range-slider/RangeSlider.svelte";
import RatingGroup from "./rating-group/RatingGroup.svelte";
import Slider from "./slider/Slider.svelte";
import ToggleButton from "./toggle-button/ToggleButton.svelte";

// The `error` message of the value controls: an alert after the control, tied
// to every focusable control through aria-describedby, with aria-invalid only
// where the control's role supports it. The server half is in ssr.test.ts.

interface Case {
  name: string;
  Component: unknown;
  props: Record<string, unknown>;
  controls: () => HTMLElement[];
  ariaInvalid: boolean;
}

const cases: Case[] = [
  {
    name: "Slider",
    Component: Slider,
    props: { label: "Volume" },
    controls: () => screen.getAllByRole("slider"),
    ariaInvalid: true,
  },
  {
    name: "RangeSlider",
    Component: RangeSlider,
    props: { label: "Price", thumbLabels: ["Minimum price", "Maximum price"] },
    controls: () => screen.getAllByRole("slider"),
    ariaInvalid: true,
  },
  {
    name: "PinInput",
    Component: PinInput,
    props: { label: "Code", length: 4 },
    controls: () => screen.getAllByRole("textbox"),
    ariaInvalid: true,
  },
  {
    name: "RatingGroup",
    Component: RatingGroup,
    props: { label: "Rating" },
    controls: () => screen.getAllByRole("radio"),
    ariaInvalid: false,
  },
  {
    name: "ToggleButton",
    Component: ToggleButton,
    props: { label: "Bold" },
    controls: () => screen.getAllByRole("checkbox"),
    ariaInvalid: false,
  },
];

const message = "Pick a value first.";

describe("value control error messages", () => {
  for (const { name, Component, props, controls, ariaInvalid } of cases) {
    describe(name, () => {
      const mount = (extra: Record<string, unknown>) =>
        render(Component as Component<Record<string, unknown>>, { props: { ...props, ...extra } });

      it("renders the message as an alert that describes every control", () => {
        mount({ error: message });
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(message);
        expect(alert.id).toMatch(/-error$/);
        for (const control of controls()) {
          expect(control).toHaveAttribute("aria-describedby", alert.id);
          expect(control).toHaveAccessibleDescription(message);
          if (ariaInvalid) expect(control).toHaveAttribute("aria-invalid", "true");
          else expect(control).not.toHaveAttribute("aria-invalid");
        }
      });

      it("keeps aria-invalid off any group around the controls", () => {
        const { container } = mount({ error: message });
        for (const group of container.querySelectorAll('[role="group"], [role="radiogroup"]')) {
          expect(group).not.toHaveAttribute("aria-invalid");
        }
      });

      it("treats the message as text", () => {
        mount({ error: "<b>Wrong</b>" });
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("<b>Wrong</b>");
        expect(alert.querySelector("b")).toBeNull();
      });

      it("removes the message and the wiring when the error clears", async () => {
        const { rerender } = mount({ error: message });
        await rerender({ ...props, error: "" });
        expect(screen.queryByRole("alert")).toBeNull();
        for (const control of controls()) {
          expect(control).not.toHaveAttribute("aria-describedby");
          expect(control).not.toHaveAttribute("aria-invalid");
        }
      });

      it("renders nothing extra without an error", () => {
        mount({});
        expect(screen.queryByRole("alert")).toBeNull();
        for (const control of controls()) expect(control).not.toHaveAttribute("aria-describedby");
      });

      it("has no accessibility violations with an error", async () => {
        const { container } = mount({ error: message });
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  }

  it("marks the PIN cells invalid from the error alone", () => {
    const { container } = render(PinInput, {
      props: { label: "Code", length: 4, success: true, error: message },
    });
    const group = container.querySelector('[role="group"]')!;
    expect(group).toHaveAttribute("data-invalid");
    expect(group).not.toHaveAttribute("data-success");
  });
});
