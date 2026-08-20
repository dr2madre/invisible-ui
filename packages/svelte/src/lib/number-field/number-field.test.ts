import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import FormFixture from "./form-number-field.fixture.svelte";
import Fixture from "./number-field.fixture.svelte";

const input = (name = "Amount") => screen.getByRole("spinbutton", { name }) as HTMLInputElement;
const increment = (name = "Increase Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;
const decrement = (name = "Decrease Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

describe("Svelte NumberField", () => {
  it("renders the initial value formatted in the resolved locale", () => {
    render(Fixture, { props: { value: 12345.5, providerLocale: "it-IT" } });
    expect(input().value).toBe("12.345,5");
    expect(input()).toHaveAttribute("inputmode", "decimal");
    expect(input()).toHaveAttribute("type", "text");
  });

  it("keeps a transient draft as typed, without premature formatting", async () => {
    render(Fixture, { props: { providerLocale: "it-IT", step: 0.5 } });
    await fireEvent.input(input(), { target: { value: "12," } });
    expect(input().value).toBe("12,");
    expect(input()).toHaveAttribute("data-state", "incomplete");
  });

  it("emits one change per edit and one commit on blur, reformatting", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(Fixture, {
      props: { providerLocale: "it-IT", step: 0.5, onValueChange, onValueCommit },
    });
    await fireEvent.input(input(), { target: { value: "12345,5" } });
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

  it("reflects a controlled value without emitting and honors give-back", async () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { rerender } = render(Fixture, {
      props: { value: 5, onValueChange, onValueCommit },
    });
    await rerender({ value: 9 });
    expect(input().value).toBe("9");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
    // Give-back: the parent hands back the value the field just reported.
    await fireEvent.input(input(), { target: { value: "7" } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await rerender({ value: 7 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(input().value).toBe("7");
  });

  it("does not yank a focused draft when the parent reflects a value", async () => {
    const { rerender } = render(Fixture, { props: { value: 5 } });
    input().focus();
    await fireEvent.input(input(), { target: { value: "7." } });
    await rerender({ value: 100 });
    expect(input().value).toBe("7.");
    expect(input()).toHaveAttribute("aria-valuenow", "100");
  });

  it("steps with the buttons, keeps them named per label, commits each spin", async () => {
    const onValueCommit = vi.fn();
    render(Fixture, { props: { value: 2, step: 0.5, onValueCommit } });
    expect(increment()).toHaveAttribute("tabindex", "-1");
    await fireEvent.click(increment());
    expect(input().value).toBe("2.5");
    await fireEvent.click(decrement());
    expect(input().value).toBe("2");
    expect(onValueCommit).toHaveBeenCalledTimes(2);
  });

  it("disables the matching button at a bound", () => {
    render(Fixture, { props: { value: 10, min: 0, max: 10 } });
    expect(increment()).toBeDisabled();
    expect(decrement()).not.toBeDisabled();
  });

  it("shows a localized validation message for a typed violation", async () => {
    render(Fixture, { props: { max: 10 } });
    await fireEvent.input(input(), { target: { value: "999" } });
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a number that is at most 10.")).toBeVisible();
  });

  it("keeps a consumer error safe, described, and announced", () => {
    render(Fixture, {
      props: { error: "<script>bad()</script>", description: "Helpful hint" },
    });
    const el = input();
    expect(el).toHaveAttribute("aria-invalid", "true");
    const describedBy = el.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(" ");
    expect(ids).toHaveLength(2);
    const errorEl = document.getElementById(ids[1]!)!;
    expect(errorEl.textContent).toContain("<script>bad()</script>");
    expect(errorEl.querySelector("script")).toBeNull();
    expect(document.getElementById(ids[0]!)!.textContent).toBe("Helpful hint");
  });

  it("reformats an idle display on a post-mount locale change without callbacks", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, {
      props: { value: 12345.5, providerLocale: "en", onValueChange },
    });
    expect(input().value).toBe("12,345.5");
    await rerender({ providerLocale: "it-IT" });
    expect(input().value).toBe("12.345,5");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps a focused draft across a locale change", async () => {
    const { rerender } = render(Fixture, { props: { providerLocale: "en" } });
    input().focus();
    await fireEvent.input(input(), { target: { value: "12." } });
    await rerender({ providerLocale: "it-IT" });
    expect(input().value).toBe("12.");
    expect(document.activeElement).toBe(input());
  });

  it("replaces callbacks live", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: { onValueChange: first } });
    await rerender({ onValueChange: second });
    await fireEvent.input(input(), { target: { value: "3" } });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(3);
  });

  it("blocks editing when disabled or read-only", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, {
      props: { value: 5, disabled: true, onValueChange },
    });
    expect(input()).toBeDisabled();
    expect(increment()).toBeDisabled();
    await rerender({ disabled: false, readOnly: true });
    expect(input()).toHaveAttribute("readonly");
    await fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("gives sibling fields distinct ids and wiring", () => {
    render(Fixture, { props: { second: true } });
    const first = input();
    const other = input("Other");
    expect(first.id).not.toBe(other.id);
    expect(screen.getByText("Other").closest("label")).toHaveAttribute("for", other.id);
  });

  it("submits the canonical ASCII value and omits it when disabled", async () => {
    const { rerender } = render(FormFixture, {});
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("amount")).toBe("1234.5");
    // The visible localized text is never the payload.
    expect(input().value).toBe("1234,5");
    await rerender({ disabled: true });
    expect(new FormData(form).has("amount")).toBe(false);
  });

  it("honors an outside form owner via the form attribute", () => {
    render(FormFixture, {});
    const owner = screen.getByTestId("owner-form") as HTMLFormElement;
    expect(new FormData(owner).get("outside")).toBe("2");
  });

  it("restores the mount value on form reset without callbacks", async () => {
    render(FormFixture, {});
    await fireEvent.input(input(), { target: { value: "77" } });
    expect(input().value).toBe("77");
    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await Promise.resolve();
    expect(input().value).toBe("1234,5");
    expect(new FormData(form).get("amount")).toBe("1234.5");
  });
});
