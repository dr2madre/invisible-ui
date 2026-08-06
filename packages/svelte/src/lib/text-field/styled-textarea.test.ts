import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Textarea from "./Textarea.svelte";

describe("Svelte Textarea (styled)", () => {
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

  it("reflects the error/invalid state", () => {
    render(Textarea, { props: { label: "Message", error: "Too short." } });
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByRole("alert");
    expect(screen.getByLabelText("Message").getAttribute("aria-describedby")).toContain(error.id);
  });

  it("participates in a native form under its name", async () => {
    const user = userEvent.setup();
    const { container } = render(Textarea, { props: { label: "Message", name: "message" } });
    const form = document.createElement("form");
    container.parentNode?.insertBefore(form, container);
    form.appendChild(container);

    await user.type(screen.getByLabelText("Message"), "Hi");
    expect(new FormData(form).get("message")).toBe("Hi");
  });

  it("links the success message so a screen reader reaches it", () => {
    render(Textarea, { props: { label: "Message", success: "Looks good." } });
    const message = screen.getByText("Looks good.");

    expect(screen.getByLabelText("Message").getAttribute("aria-describedby") ?? "").toContain(
      message.id,
    );
    expect(message).toHaveAttribute("aria-live", "polite");
  });

  it("describes by the error alone when both error and success are given", () => {
    render(Textarea, {
      props: { label: "Message", error: "Too short.", success: "Looks good." },
    });
    const describedby = screen.getByLabelText("Message").getAttribute("aria-describedby") ?? "";

    expect(describedby).toBe(screen.getByRole("alert").id);
    expect(screen.queryByText("Looks good.")).toBeNull();
  });

  it("carries a glyph in each message, so meaning is not colour-only", () => {
    const { container, rerender } = render(Textarea, {
      props: { label: "Message", error: "Too short." },
    });
    expect(container.querySelector(".field__error .field__msg-icon")).not.toBeNull();

    rerender({ label: "Message", error: undefined, success: "Looks good." });
    expect(container.querySelector(".field__success .field__msg-icon")).not.toBeNull();
  });

  it("forwards the autocomplete hint to the control", () => {
    render(Textarea, { props: { label: "Address", autocomplete: "street-address" } });
    expect(screen.getByLabelText("Address")).toHaveAttribute("autocomplete", "street-address");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Textarea, {
      props: { label: "Bio", description: "About you.", success: "Looks good." },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
