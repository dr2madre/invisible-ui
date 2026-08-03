import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PinInput } from "./PinInput";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const cells = () => screen.getAllByRole<HTMLInputElement>("textbox");

describe("Vue PinInput (styled)", () => {
  it("renders a labelled group of cells", () => {
    render(PinInput, { props: { length: 4, label: "Verification code" } });
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(cells()).toHaveLength(4);
  });

  it("fills a cell on input, advances focus, and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(PinInput, { props: { length: 4, label: "Verification code", onValueChange } });

    await user.click(cells()[0]!);
    await user.keyboard("1");
    expect(onValueChange).toHaveBeenLastCalledWith("1");
    expect(cells()[1]).toHaveFocus();
  });

  it("ignores characters outside the numeric type", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(PinInput, { props: { length: 4, label: "Verification code", onValueChange } });

    await user.click(cells()[0]!);
    await user.keyboard("a");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cells()[0]).toHaveValue("");
  });

  it("accepts letters for an alphanumeric code", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(PinInput, {
      props: { length: 4, type: "alphanumeric", label: "Verification code", onValueChange },
    });

    await user.click(cells()[0]!);
    await user.keyboard("a");
    expect(onValueChange).toHaveBeenLastCalledWith("a");
  });

  it("clears with Backspace and steps back when empty", async () => {
    const user = userEvent.setup();
    render(PinInput, { props: { length: 4, value: "12", label: "Verification code" } });

    await user.click(cells()[2]!);
    await user.keyboard("{Backspace}");
    expect(cells()[1]).toHaveFocus();
    expect(cells()[1]).toHaveValue("");
  });

  it("moves between cells with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(PinInput, { props: { length: 4, label: "Verification code" } });

    await user.click(cells()[1]!);
    await user.keyboard("{ArrowRight}");
    expect(cells()[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cells()[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(cells()[3]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cells()[0]).toHaveFocus();
  });

  it("distributes a pasted code across the cells", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(PinInput, { props: { length: 4, label: "Verification code", onComplete } });

    await user.click(cells()[0]!);
    await user.paste("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(cells()[3]).toHaveValue("4");
  });

  it("distributes a paste from the focused cell onwards, dropping stray characters", async () => {
    const user = userEvent.setup();
    render(PinInput, { props: { length: 4, label: "Verification code" } });

    await user.click(cells()[1]!);
    await user.paste("9-8");
    expect(cells()[0]).toHaveValue("");
    expect(cells()[1]).toHaveValue("9");
    expect(cells()[2]).toHaveValue("8");
  });

  it("supports v-model: emits update:modelValue as the code grows", async () => {
    const user = userEvent.setup();
    const { emitted } = render(PinInput, {
      props: { length: 4, modelValue: "", label: "Verification code" },
    });

    await user.click(cells()[0]!);
    await user.keyboard("7");
    expect(emitted("update:modelValue")).toEqual([["7"]]);
  });

  it("masks the cells on request", () => {
    const { container } = render(PinInput, {
      props: { length: 4, mask: true, label: "Verification code" },
    });
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(4);
  });

  it("flags the invalid state on the group and its cells", () => {
    const { container } = render(PinInput, {
      props: { length: 4, invalid: true, label: "Verification code" },
    });
    expect(container.querySelector(".pin-input")).toHaveAttribute("data-invalid", "");
    expect(cells()[0]).toHaveAttribute("aria-invalid", "true");
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(PinInput, {
      props: { length: 4, disabled: true, label: "Verification code", onValueChange },
    });

    expect(cells()[0]).toBeDisabled();
    await user.click(cells()[0]!);
    await user.keyboard("1");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the combined code under the field name", () => {
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(PinInput, { label: "Verification code", name: "code", value: "123456", length: 6 }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("code")).toBe("123456");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(PinInput, { props: { length: 4, label: "Verification code" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
