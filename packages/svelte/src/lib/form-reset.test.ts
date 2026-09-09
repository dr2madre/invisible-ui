import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TextField from "./text-field/TextField.svelte";

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("form reset, TextField pilot", () => {
  const mount = (props: Record<string, unknown> = {}) => {
    const onValueChange = vi.fn();
    const rendered = render(TextField, {
      props: { label: "Name", name: "name", value: "Ada", onValueChange, ...props },
    });
    const form = document.createElement("form");
    // Wrap the rendered control in a real form.
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);
    return { ...rendered, form, onValueChange };
  };

  it("restores the payload, the visible value, and stays silent", async () => {
    const user = userEvent.setup();
    const { form, onValueChange } = mount();
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");
    expect(new FormData(form).get("name")).toBe("Grace");
    const calls = onValueChange.mock.calls.length;

    form.reset();
    await settled();
    expect(new FormData(form).get("name")).toBe("Ada");
    expect(input).toHaveValue("Ada");
    expect(onValueChange.mock.calls.length, "a reset is not a user change").toBe(calls);
  });

  it("restores the default the prop moved to, not the mount value", async () => {
    const user = userEvent.setup();
    const { form, rerender } = mount();
    await rerender({ label: "Name", name: "name", value: "Marie" });
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveValue("Marie");
    await user.clear(input);
    await user.type(input, "Grace");

    form.reset();
    await settled();
    expect(new FormData(form).get("name")).toBe("Marie");
    expect(input).toHaveValue("Marie");
  });

  it("the machine agrees with the restored page, so a later render keeps it", async () => {
    const user = userEvent.setup();
    const { form, rerender } = mount();
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");

    form.reset();
    await settled();
    // A render after the reset must not write the old edit back: that is what
    // a browser-only restore with a stale machine would do.
    await rerender({ label: "Name", name: "name", value: "Ada", error: "changed" });
    expect(input).toHaveValue("Ada");
    expect(new FormData(form).get("name")).toBe("Ada");
  });

  it("a cancelled reset restores nothing", async () => {
    const user = userEvent.setup();
    const { form } = mount();
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
    const { form, unmount } = mount();
    unmount();
    expect(() => form.reset()).not.toThrow();
    await settled();
  });
});
