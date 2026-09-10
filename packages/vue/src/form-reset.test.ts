import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "./text-field/TextField";

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Render a control inside a real form and hand back both. */
const inForm = (component: unknown, props: Record<string, unknown>) => {
  const rendered = render(
    defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [h(component as never, props as never)]),
    }),
  );
  return { ...rendered, form: screen.getByTestId("host") as HTMLFormElement };
};

describe("Vue form reset, TextField pilot", () => {
  it("restores the payload, the visible value, and stays silent", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { form } = inForm(TextField, {
      label: "Name",
      name: "name",
      value: "Ada",
      onValueChange,
    });
    const input = screen.getByRole("textbox", { name: "Name" });

    await user.clear(input);
    await user.type(input, "Grace");
    expect(new FormData(form).get("name")).toBe("Grace");
    const reported = onValueChange.mock.calls.length;
    expect(reported).toBeGreaterThan(0);

    form.reset();
    await settled();
    expect(new FormData(form).get("name")).toBe("Ada");
    expect(input).toHaveValue("Ada");
    expect(onValueChange.mock.calls.length, "a reset is not a user change").toBe(reported);
  });

  it("carries the default as an attribute, and it does not follow the edit", async () => {
    const user = userEvent.setup();
    const { form } = inForm(TextField, { label: "Name", name: "name", value: "Ada" });
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(input.getAttribute("value")).toBe("Ada");

    await user.type(input, "!");
    expect(input.value).toBe("Ada!");
    expect(input.getAttribute("value"), "the default must not follow the edit").toBe("Ada");
    expect(new FormData(form).get("name")).toBe("Ada!");
  });

  it("restores the default the prop moved to, not the mount value", async () => {
    const user = userEvent.setup();
    const value = ref("Ada");
    const Host = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [
          h(TextField, { label: "Name", name: "name", value: value.value }),
        ]),
    });
    render(Host);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = screen.getByRole("textbox", { name: "Name" });

    value.value = "Marie";
    await settled();
    expect(input).toHaveValue("Marie");
    await user.clear(input);
    await user.type(input, "Grace");

    form.reset();
    await settled();
    expect(new FormData(form).get("name")).toBe("Marie");
    expect(input).toHaveValue("Marie");
  });

  it("an echoed report does not move the default", async () => {
    const user = userEvent.setup();
    const value = ref("Ada");
    const Host = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [
          h(TextField, {
            label: "Name",
            name: "name",
            value: value.value,
            onValueChange: (next: string) => (value.value = next),
          }),
        ]),
    });
    render(Host);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = screen.getByRole("textbox", { name: "Name" });

    await user.clear(input);
    await user.type(input, "Grace");
    expect(value.value).toBe("Grace");

    form.reset();
    await settled();
    expect(new FormData(form).get("name"), "an echo is not a new default").toBe("Ada");
  });

  it("judges the next prop change against what the page now shows", async () => {
    const user = userEvent.setup();
    const value = ref("Ada");
    const Host = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [
          h(TextField, { label: "Name", name: "name", value: value.value }),
        ]),
    });
    render(Host);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = screen.getByRole("textbox", { name: "Name" });

    await user.clear(input);
    await user.type(input, "Grace");
    form.reset();
    await settled();

    // The consumer now chooses the very text the user had typed: a new
    // default, and one only a restored control can tell from an echo.
    value.value = "Grace";
    await settled();
    await user.clear(input);
    await user.type(input, "Hopper");
    form.reset();
    await settled();
    expect(new FormData(form).get("name")).toBe("Grace");
    expect(input).toHaveValue("Grace");
  });

  it("a cancelled reset restores nothing", async () => {
    const user = userEvent.setup();
    const { form } = inForm(TextField, { label: "Name", name: "name", value: "Ada" });
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });

    form.reset();
    await settled();
    expect(input).toHaveValue("Grace");
    expect(new FormData(form).get("name")).toBe("Grace");
  });

  it("a control that has left the page hears nothing", async () => {
    const { form, unmount } = inForm(TextField, { label: "Name", name: "name", value: "Ada" });
    unmount();
    expect(() => form.reset()).not.toThrow();
    await settled();
  });
});
