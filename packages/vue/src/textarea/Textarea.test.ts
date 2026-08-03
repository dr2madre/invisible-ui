import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Textarea } from "./Textarea";

describe("Vue Textarea (styled)", () => {
  it("renders a labelled multi-line control", () => {
    render(Textarea, { props: { label: "Message", rows: 5 } });
    const control = screen.getByLabelText("Message");
    expect(control.tagName).toBe("TEXTAREA");
    expect(control).toHaveAttribute("rows", "5");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Textarea, { props: { label: "Message", onValueChange } });

    await user.type(screen.getByLabelText("Message"), "Hi");
    expect(onValueChange).toHaveBeenLastCalledWith("Hi");
  });

  it("supports v-model: emits update:modelValue while typing", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Textarea, { props: { label: "Message", modelValue: "" } });

    await user.type(screen.getByLabelText("Message"), "Hi");
    const events = emitted("update:modelValue");
    expect(events.at(-1)).toEqual(["Hi"]);
  });

  it("reflects the error/invalid state", () => {
    render(Textarea, { props: { label: "Message", error: "Too short." } });
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByRole("alert");
    expect(screen.getByLabelText("Message").getAttribute("aria-describedby")).toContain(error.id);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Textarea, {
      props: { label: "Bio", description: "About you." },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
