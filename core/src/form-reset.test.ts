// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { onFormReset } from "./form-reset";

// The ADR 0012 mechanism, tested where it lives. The adapters' suites drive
// real controls; this holds the four rules of the listener itself, each one
// proven by a mutation that once survived every test in the repository.
describe("onFormReset", () => {
  const teardowns: Array<() => void> = [];
  afterEach(() => {
    for (const teardown of teardowns.splice(0)) teardown();
    document.body.innerHTML = "";
  });

  interface Hosted {
    form: HTMLFormElement;
    input: HTMLInputElement;
  }

  function host(): Hosted {
    const form = document.createElement("form");
    const input = document.createElement("input");
    form.append(input);
    document.body.append(form);
    return { form, input };
  }

  const mount = (): [Hosted] => [host()];
  const mountTwo = (): [Hosted, Hosted] => [host(), host()];

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("restores one task after its own form's reset", async () => {
    const [{ form, input }] = mount();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    expect(restore, "the browser has not restored yet at event time").not.toHaveBeenCalled();
    await tick();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it("restores nothing when the reset was cancelled", async () => {
    const [{ form, input }] = mount();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    form.addEventListener("reset", (event: Event) => event.preventDefault());
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore).not.toHaveBeenCalled();
  });

  it("answers only its own form's reset", async () => {
    const [{ input }, { form: other }] = mountTwo();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    other.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore).not.toHaveBeenCalled();
  });

  it("follows the owner it has at event time, not at mount", async () => {
    const [{ form: first, input }, { form: second }] = mountTwo();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    second.append(input);
    first.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore, "the old owner's reset is not this control's").not.toHaveBeenCalled();
    second.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a control in no form", async () => {
    const [{ form, input }] = mount();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    input.remove();
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore).not.toHaveBeenCalled();
  });

  it("teardown clears a restore still pending", async () => {
    const [{ form, input }] = mount();
    const restore = vi.fn();
    const teardown = onFormReset(document, () => input, restore);
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    teardown();
    await tick();
    expect(restore, "a control taken down must not restore into nothing").not.toHaveBeenCalled();
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    await tick();
    expect(restore, "the listener is gone with the teardown").not.toHaveBeenCalled();
  });

  it("answers each reset on its own: a cancelled one does not call off an earlier one", async () => {
    const [{ form, input }] = mount();
    const restore = vi.fn();
    teardowns.push(onFormReset(document, () => input, restore));
    form.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
    const cancelled = new Event("reset", { bubbles: true, cancelable: true });
    form.addEventListener("reset", (event: Event) => event.preventDefault(), { once: true });
    form.dispatchEvent(cancelled);
    await tick();
    expect(restore).toHaveBeenCalledTimes(1);
  });
});
