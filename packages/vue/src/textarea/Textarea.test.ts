import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
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
    expect(error.querySelector(".field__msg-icon svg")).toBeInTheDocument();
  });

  it("submits its value and forwards autocomplete", () => {
    render({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(Textarea, {
            label: "Message",
            name: "message",
            value: "Hello",
            autocomplete: "off",
          }),
        ]),
    });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(screen.getByLabelText("Message")).toHaveAttribute("autocomplete", "off");
    expect(new FormData(form).get("message")).toBe("Hello");
  });

  it("links and announces success feedback", () => {
    render(Textarea, { props: { label: "Message", success: "Looks good." } });
    const success = screen.getByText("Looks good.");
    expect(success).toHaveAttribute("aria-live", "polite");
    expect(screen.getByLabelText("Message").getAttribute("aria-describedby")).toContain(success.id);
    expect(success.querySelector(".field__msg-icon svg")).toBeInTheDocument();
  });

  it("lets the error win over simultaneous success feedback", () => {
    render(Textarea, {
      props: { label: "Message", error: "Too short.", success: "Looks good." },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Too short.");
    expect(screen.queryByText("Looks good.")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Textarea, {
      props: { label: "Bio", description: "About you." },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
