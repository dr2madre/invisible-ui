import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { NumberField, type NumberFieldProps } from "./NumberField";

const input = (name = "Amount") => screen.getByRole("spinbutton", { name }) as HTMLInputElement;
const increment = (name = "Increase Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;
const decrement = (name = "Decrease Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

type FieldProps = Partial<NumberFieldProps> & { providerLocale?: string; second?: boolean };

const Field = ({ providerLocale = "en", second = false, ...props }: FieldProps) => (
  <LocaleProvider locale={providerLocale}>
    <NumberField label="Amount" {...props} />
    {second ? <NumberField label="Other" /> : null}
  </LocaleProvider>
);

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("React NumberField", () => {
  it("renders the initial value formatted in the resolved locale", () => {
    render(<Field value={12345.5} providerLocale="it-IT" />);
    expect(input().value).toBe("12.345,5");
    expect(input()).toHaveAttribute("inputmode", "decimal");
    expect(input()).toHaveAttribute("type", "text");
  });

  it("keeps a transient draft as typed, without premature formatting", () => {
    render(<Field providerLocale="it-IT" step={0.5} />);
    fireEvent.change(input(), { target: { value: "12," } });
    expect(input().value).toBe("12,");
    expect(input()).toHaveAttribute("data-state", "incomplete");
  });

  it("emits one change per edit and one commit on blur, reformatting", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Field
        providerLocale="it-IT"
        step={0.5}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    fireEvent.change(input(), { target: { value: "12345,5" } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(12345.5);
    expect(onValueCommit).not.toHaveBeenCalled();
    fireEvent.blur(input());
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenLastCalledWith(12345.5);
    expect(input().value).toBe("12.345,5");
    fireEvent.blur(input());
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it("reflects a controlled value without emitting and honors give-back", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const props = { onValueChange, onValueCommit };
    const { rerender } = render(<Field value={5} {...props} />);
    rerender(<Field value={9} {...props} />);
    expect(input().value).toBe("9");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
    // Give-back: the parent hands back the value the field just reported.
    fireEvent.change(input(), { target: { value: "7" } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    rerender(<Field value={7} {...props} />);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(input().value).toBe("7");
  });

  it("does not yank a focused draft when the parent reflects a value", () => {
    const { rerender } = render(<Field value={5} />);
    act(() => input().focus());
    fireEvent.change(input(), { target: { value: "7." } });
    rerender(<Field value={100} />);
    expect(input().value).toBe("7.");
    expect(input()).toHaveAttribute("aria-valuenow", "100");
  });

  it("steps with the buttons, keeps them named per label, commits each spin", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(<Field value={2} step={0.5} onValueCommit={onValueCommit} />);
    expect(increment()).toHaveAttribute("tabindex", "-1");
    await user.click(increment());
    expect(input().value).toBe("2.5");
    // The press keeps focus on the input, where the keyboard steps it.
    expect(input()).toHaveFocus();
    await user.click(decrement());
    expect(input().value).toBe("2");
    expect(onValueCommit).toHaveBeenCalledTimes(2);
  });

  it("steps with the arrow keys and jumps to the bounds with Home and End", async () => {
    const user = userEvent.setup();
    render(<Field value={5} min={0} max={10} />);
    await user.click(input());
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(input().value).toBe("7");
    await user.keyboard("{ArrowDown}");
    expect(input().value).toBe("6");
    await user.keyboard("{End}");
    expect(input().value).toBe("10");
    await user.keyboard("{Home}");
    expect(input().value).toBe("0");
  });

  it("reverts a draft with Escape and lets an Escape with nothing to undo through", async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(event) => event.key === "Escape" && outer()}>
        <Field value={5} />
      </div>,
    );
    await user.click(input());
    await user.keyboard("{Control>}a{/Control}8");
    expect(input().value).toBe("8");
    await user.keyboard("{Escape}");
    expect(input().value).toBe("5");
    expect(outer, "the Escape that undid the draft is swallowed").not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(outer, "an Escape with nothing to undo reaches the page").toHaveBeenCalledTimes(1);
  });

  it("steps on the wheel only when opted in, focused and hovered", () => {
    const { rerender } = render(<Field value={5} />);
    act(() => input().focus());
    fireEvent.wheel(input(), { deltaY: -1 });
    expect(input().value, "the wheel scrolls the page by default").toBe("5");
    rerender(<Field value={5} changeOnWheel />);
    const event = new WheelEvent("wheel", { deltaY: -1, bubbles: true, cancelable: true });
    act(() => {
      input().dispatchEvent(event);
    });
    expect(input().value).toBe("6");
    expect(event.defaultPrevented, "the step keeps the page from scrolling").toBe(true);
  });

  it("disables the matching button at a bound", () => {
    render(<Field value={10} min={0} max={10} />);
    expect(increment()).toBeDisabled();
    expect(decrement()).not.toBeDisabled();
  });

  it("shows a localized validation message for a typed violation", () => {
    render(<Field max={10} />);
    fireEvent.change(input(), { target: { value: "999" } });
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a number that is at most 10.")).toBeVisible();
  });

  it("keeps a consumer error safe, described, and announced", () => {
    render(<Field error="<script>bad()</script>" description="Helpful hint" />);
    const el = input();
    expect(el).toHaveAttribute("aria-invalid", "true");
    const ids = (el.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids).toHaveLength(2);
    const errorEl = document.getElementById(ids[1]!)!;
    expect(errorEl.textContent).toContain("<script>bad()</script>");
    expect(errorEl.querySelector("script")).toBeNull();
    expect(errorEl).toHaveAttribute("role", "alert");
    expect(document.getElementById(ids[0]!)!.textContent).toBe("Helpful hint");
  });

  it("reformats an idle display on a post-mount locale change without callbacks", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Field value={12345.5} providerLocale="en" onValueChange={onValueChange} />,
    );
    expect(input().value).toBe("12,345.5");
    rerender(<Field value={12345.5} providerLocale="it-IT" onValueChange={onValueChange} />);
    expect(input().value).toBe("12.345,5");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps an unfocused invalid draft across a locale change", () => {
    const { rerender } = render(<Field value={5} providerLocale="en" />);
    fireEvent.change(input(), { target: { value: "1..2" } });
    fireEvent.blur(input());
    expect(input().value).toBe("1..2");
    rerender(<Field value={5} providerLocale="it-IT" />);
    expect(input().value).toBe("1..2");
  });

  it("keeps a focused draft across a locale change", () => {
    const { rerender } = render(<Field providerLocale="en" />);
    act(() => input().focus());
    fireEvent.change(input(), { target: { value: "12." } });
    rerender(<Field providerLocale="it-IT" />);
    expect(input().value).toBe("12.");
    expect(document.activeElement).toBe(input());
  });

  it("replaces callbacks live", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Field onValueChange={first} />);
    rerender(<Field onValueChange={second} />);
    fireEvent.change(input(), { target: { value: "3" } });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(3);
  });

  it("blocks editing when disabled or read-only", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Field value={5} disabled onValueChange={onValueChange} />);
    expect(input()).toBeDisabled();
    expect(increment()).toBeDisabled();
    rerender(<Field value={5} readOnly onValueChange={onValueChange} />);
    expect(input()).toHaveAttribute("readonly");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("gives sibling fields distinct ids and wiring", () => {
    render(<Field second />);
    const first = input();
    const other = input("Other");
    expect(first.id).not.toBe(other.id);
    expect(screen.getByText("Other").closest("label")).toHaveAttribute("for", other.id);
  });

  it("submits the canonical ASCII value and omits it when disabled", () => {
    const Form = ({ disabled = false }) => (
      <form data-testid="form">
        <Field providerLocale="it-IT" name="amount" value={1234.5} step={0.5} disabled={disabled} />
      </form>
    );
    const { rerender } = render(<Form />);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("amount")).toBe("1234.5");
    // The visible localized text is never the payload.
    expect(input().value).toBe("1234,5");
    rerender(<Form disabled />);
    expect(new FormData(form).has("amount")).toBe(false);
  });

  // The reset listener anchors on the visible input, so that input carries the
  // `form` attribute.
  it("is restored by the reset of the form it names from outside it", async () => {
    render(
      <>
        <form id="owner" data-testid="owner" />
        <Field name="outside" form="owner" value={2} />
      </>,
    );
    const owner = screen.getByTestId("owner") as HTMLFormElement;
    expect(new FormData(owner).get("outside")).toBe("2");
    fireEvent.change(input(), { target: { value: "9" } });
    expect(new FormData(owner).get("outside")).toBe("9");
    owner.reset();
    await settle();
    expect(new FormData(owner).get("outside"), "the payload is back").toBe("2");
    expect(input().value, "the page agrees with the payload").toBe("2");
  });

  it("restores the prop's last value on form reset, reporting nothing", async () => {
    const onValueChange = vi.fn();
    const Form = ({ value }: { value: number }) => (
      <form data-testid="form">
        <Field name="amount" value={value} onValueChange={onValueChange} />
      </form>
    );
    const { rerender } = render(<Form value={10} />);
    // The consumer moves the prop after mount: the default moves with it,
    // and the move reports nothing.
    rerender(<Form value={25} />);
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.change(input(), { target: { value: "77" } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const form = screen.getByTestId("form") as HTMLFormElement;
    form.reset();
    await settle();
    expect(new FormData(form).get("amount"), "the new prop value, never the mount one").toBe("25");
    expect(input().value).toBe("25");
    expect(onValueChange, "a reset is not a user change").toHaveBeenCalledTimes(1);
  });

  it("a cancelled reset restores nothing, even from a later listener", async () => {
    render(
      <form data-testid="form">
        <Field name="amount" value={5} />
      </form>,
    );
    fireEvent.change(input(), { target: { value: "77" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    // Registered after the control's own listener, which must still honour it.
    document.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await settle();
    expect(input().value).toBe("77");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Field value={3} description="Units." />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
