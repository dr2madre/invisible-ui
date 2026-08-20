import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { NumberField } from "./NumberField";

const input = (name = "Amount") => screen.getByRole("spinbutton", { name }) as HTMLInputElement;
const increment = (name = "Increase Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;
const decrement = (name = "Decrease Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

const type = (text: string) => fireEvent.update(input(), text);

describe("Vue NumberField (styled)", () => {
  it("renders the initial value formatted in the given locale", () => {
    render(NumberField, { props: { label: "Amount", value: 12345.5, locale: "it-IT" } });
    expect(input().value).toBe("12.345,5");
    expect(input()).toHaveAttribute("inputmode", "decimal");
    expect(input()).toHaveAttribute("type", "text");
  });

  it("keeps a transient draft as typed, without premature formatting", async () => {
    render(NumberField, { props: { label: "Amount", locale: "it-IT", step: 0.5 } });
    await type("12,");
    expect(input().value).toBe("12,");
    expect(input()).toHaveAttribute("data-state", "incomplete");
  });

  it("emits one change per edit and one commit on blur, reformatting", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(NumberField, {
      props: { label: "Amount", locale: "it-IT", step: 0.5, onValueChange, onValueCommit },
    });
    await type("12345,5");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(12345.5);
    expect(onValueCommit).not.toHaveBeenCalled();
    await fireEvent.blur(input());
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenLastCalledWith(12345.5);
    expect(input().value).toBe("12.345,5");
    await fireEvent.blur(input());
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it("supports v-model on the canonical value", async () => {
    const { emitted } = render(NumberField, {
      props: { label: "Amount", modelValue: null, step: 0.5 },
    });
    await type("2.5");
    const events = emitted("update:modelValue");
    expect(events.at(-1)).toEqual([2.5]);
  });

  it("reflects a controlled value without emitting and honors give-back", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { rerender } = render(NumberField, {
      props: { label: "Amount", value: 5, onValueChange, onValueCommit },
    });
    await rerender({ value: 9 });
    expect(input().value).toBe("9");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
    await type("7");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await rerender({ value: 7 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(input().value).toBe("7");
  });

  it("does not yank a focused draft when the parent reflects a value", async () => {
    const { rerender } = render(NumberField, { props: { label: "Amount", value: 5 } });
    input().focus();
    await type("7.");
    await rerender({ value: 100 });
    expect(input().value).toBe("7.");
    expect(input()).toHaveAttribute("aria-valuenow", "100");
  });

  it("steps with the buttons, keeps them named per label, commits each spin", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(NumberField, { props: { label: "Amount", value: 2, step: 0.5, onValueCommit } });
    expect(increment()).toHaveAttribute("tabindex", "-1");
    await user.click(increment());
    expect(input().value).toBe("2.5");
    await user.click(decrement());
    expect(input().value).toBe("2");
    expect(onValueCommit).toHaveBeenCalledTimes(2);
  });

  it("disables the matching button at a bound", () => {
    render(NumberField, { props: { label: "Amount", value: 10, min: 0, max: 10 } });
    expect(increment()).toBeDisabled();
    expect(decrement()).not.toBeDisabled();
  });

  it("shows a localized validation message for a typed violation", async () => {
    render(NumberField, { props: { label: "Amount", max: 10 } });
    await type("999");
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a number that is at most 10.")).toBeVisible();
  });

  it("keeps a consumer error safe, described, and announced", () => {
    render(NumberField, {
      props: { label: "Amount", error: "<script>bad()</script>", description: "Helpful hint" },
    });
    const el = input();
    expect(el).toHaveAttribute("aria-invalid", "true");
    const ids = (el.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids).toHaveLength(2);
    const errorEl = document.getElementById(ids[1]!)!;
    expect(errorEl.textContent).toContain("<script>bad()</script>");
    expect(errorEl.querySelector("script")).toBeNull();
    expect(document.getElementById(ids[0]!)!.textContent).toBe("Helpful hint");
  });

  it("resolves the locale from the provider and reformats on a post-mount change", async () => {
    const onValueChange = vi.fn();
    const Fixture = defineComponent({
      props: { locale: { type: String, default: "en" } },
      setup(props) {
        return () =>
          h(LocaleProvider, { locale: props.locale }, () =>
            h(NumberField, { label: "Amount", value: 12345.5, onValueChange }),
          );
      },
    });
    const { rerender } = render(Fixture, { props: { locale: "en" } });
    expect(input().value).toBe("12,345.5");
    await rerender({ locale: "it-IT" });
    expect(input().value).toBe("12.345,5");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps an unfocused invalid draft across a locale change", async () => {
    const { rerender } = render(NumberField, {
      props: { label: "Amount", value: 5, locale: "en" },
    });
    await type("1..2");
    await fireEvent.blur(input());
    expect(input().value).toBe("1..2");
    await rerender({ locale: "it-IT" });
    expect(input().value).toBe("1..2");
  });

  it("keeps a focused draft across a locale change", async () => {
    const { rerender } = render(NumberField, { props: { label: "Amount", locale: "en" } });
    input().focus();
    await type("12.");
    await rerender({ locale: "it-IT" });
    expect(input().value).toBe("12.");
    expect(document.activeElement).toBe(input());
  });

  it("replaces callbacks live", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(NumberField, {
      props: { label: "Amount", onValueChange: first },
    });
    await rerender({ onValueChange: second });
    await type("3");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(3);
  });

  it("blocks editing when disabled or read-only", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(NumberField, {
      props: { label: "Amount", value: 5, disabled: true, onValueChange },
    });
    expect(input()).toBeDisabled();
    expect(increment()).toBeDisabled();
    await rerender({ disabled: false, readOnly: true });
    expect(input()).toHaveAttribute("readonly");
    await fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("gives sibling fields distinct ids and wiring", () => {
    const Fixture = defineComponent({
      setup() {
        return () =>
          h("div", [h(NumberField, { label: "Amount" }), h(NumberField, { label: "Other" })]);
      },
    });
    render(Fixture);
    expect(input().id).not.toBe(input("Other").id);
  });

  it("submits the canonical ASCII value, omits it when disabled, resets on form reset", async () => {
    const Fixture = defineComponent({
      props: { disabled: { type: Boolean, default: false } },
      setup(props) {
        return () =>
          h("form", { "data-testid": "form" }, [
            h(NumberField, {
              label: "Amount",
              name: "amount",
              value: 1234.5,
              locale: "it-IT",
              step: 0.5,
              disabled: props.disabled,
            }),
          ]);
      },
    });
    const { rerender } = render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("amount")).toBe("1234.5");
    expect(input().value).toBe("1234,5");

    await type("77");
    form.reset();
    await Promise.resolve();
    expect(new FormData(form).get("amount")).toBe("1234.5");

    await rerender({ disabled: true });
    expect(new FormData(form).has("amount")).toBe(false);
  });

  it("honors an outside form owner via the form attribute", () => {
    const Fixture = defineComponent({
      setup() {
        return () =>
          h("div", [
            h(NumberField, { label: "Outside", name: "outside", form: "owner-form", value: 2 }),
            h("form", { id: "owner-form", "data-testid": "owner-form" }),
          ]);
      },
    });
    render(Fixture);
    const owner = screen.getByTestId("owner-form") as HTMLFormElement;
    expect(new FormData(owner).get("outside")).toBe("2");
  });

  it("has no axe violations, including with an error shown", async () => {
    const { container } = render(NumberField, {
      props: { label: "Amount", value: 5, description: "Hint", error: "Wrong", required: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
