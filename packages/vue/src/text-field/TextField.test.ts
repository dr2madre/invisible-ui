import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TextField } from "./TextField";

describe("Vue TextField (styled)", () => {
  it("renders a labelled text input", () => {
    render(TextField, { props: { label: "Full name" } });
    const input = screen.getByLabelText("Full name");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "text");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(TextField, { props: { label: "Full name", onValueChange } });

    await user.type(screen.getByLabelText("Full name"), "Jane");
    expect(onValueChange).toHaveBeenLastCalledWith("Jane");
  });

  it("supports v-model: emits update:modelValue while typing", async () => {
    const user = userEvent.setup();
    const { emitted } = render(TextField, { props: { label: "Full name", modelValue: "" } });

    await user.type(screen.getByLabelText("Full name"), "Jane");
    const events = emitted("update:modelValue");
    expect(events.at(-1)).toEqual(["Jane"]);
  });

  it("links the description and reflects the error/invalid state", () => {
    render(TextField, {
      props: {
        label: "Email",
        type: "email",
        description: "We never share it.",
        error: "Invalid email.",
      },
    });
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedby = input.getAttribute("aria-describedby") ?? "";
    expect(describedby).toContain(screen.getByText("We never share it.").id);
    expect(describedby).toContain(screen.getByRole("alert").id);
  });

  it("marks required with aria-required", () => {
    render(TextField, { props: { label: "Username", required: true } });
    expect(screen.getByLabelText(/Username/)).toHaveAttribute("aria-required", "true");
  });

  it("shows the success message and check when validated", () => {
    render(TextField, { props: { label: "Email", success: "Looks good." } });
    expect(screen.getByText("Looks good.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("links the success message so a screen reader reaches it", () => {
    render(TextField, { props: { label: "Email", success: "Looks good." } });
    const message = screen.getByText("Looks good.");

    expect(screen.getByLabelText("Email").getAttribute("aria-describedby") ?? "").toContain(
      message.id,
    );
    expect(message).toHaveAttribute("aria-live", "polite");
  });

  it("describes by the error alone when both error and success are given", () => {
    render(TextField, {
      props: { label: "Email", error: "Invalid email.", success: "Looks good." },
    });
    const describedby = screen.getByLabelText("Email").getAttribute("aria-describedby") ?? "";

    expect(describedby).toBe(screen.getByRole("alert").id);
    expect(screen.queryByText("Looks good.")).toBeNull();
  });

  it("disables the control and stays silent", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(TextField, { props: { label: "Full name", disabled: true, onValueChange } });

    const input = screen.getByLabelText("Full name");
    expect(input).toBeDisabled();
    await user.type(input, "x");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("mirrors an externally controlled value", async () => {
    const { rerender } = render(TextField, { props: { label: "Full name", value: "Ada" } });
    expect(screen.getByLabelText("Full name")).toHaveValue("Ada");
    await rerender({ value: "Grace" });
    expect(screen.getByLabelText("Full name")).toHaveValue("Grace");
  });

  it("participates in a native form under its name", async () => {
    const user = userEvent.setup();
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(TextField, { label: "Email", type: "email", name: "email" }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
    expect(new FormData(form).get("email")).toBe("a@b.co");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(TextField, {
      props: { label: "Email", type: "email", description: "We never share it." },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
