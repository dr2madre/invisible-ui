import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsPinInput } from "./ds-pin-input";

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (attributes = 'length="4"', wrap = (html: string) => html) => {
  document.body.innerHTML = wrap(
    `<ds-pin-input label="Verification code" ${attributes}></ds-pin-input>`,
  );
  return document.querySelector("ds-pin-input") as DsPinInput;
};

const cells = () => screen.getAllByRole("textbox") as HTMLInputElement[];

const recorder = (host: HTMLElement, type: "change" | "complete") => {
  const seen: string[] = [];
  host.addEventListener(type, (event) => seen.push((event as CustomEvent).detail.value));
  return seen;
};

describe("<ds-pin-input>", () => {
  it("renders a labelled group of named cells", async () => {
    mount();
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(cells()).toHaveLength(4);
    expect(cells()[0]).toHaveAccessibleName("Character 1 of 4");
    expect(cells()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(cells()[0]).toHaveAttribute("inputmode", "numeric");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("names the cells from the catalog in the provider's locale", () => {
    mount('length="4"', (html) => `<ds-locale-provider locale="it">${html}</ds-locale-provider>`);
    const provider = document.querySelector("ds-locale-provider") as unknown as {
      messages: object;
    };
    provider.messages = { "pinInput.cell": "Carattere {index} di {length}" };
    expect(cells()[2]).toHaveAccessibleName("Carattere 3 di 4");
  });

  it("fills a cell on input, advances focus, and reports the value", async () => {
    const user = userEvent.setup();
    const host = mount();
    const changes = recorder(host, "change");
    await user.click(cells()[0]!);
    await user.keyboard("1");
    expect(changes).toEqual(["1"]);
    expect(cells()[1]).toHaveFocus();
    expect(host.value).toBe("1");
    expect(host.getAttribute("value")).toBe("1");
  });

  it("ignores characters outside the numeric type", async () => {
    const user = userEvent.setup();
    const host = mount();
    const changes = recorder(host, "change");
    await user.click(cells()[0]!);
    await user.keyboard("a");
    expect(changes).toEqual([]);
    expect(cells()[0]).toHaveValue("");
  });

  it("accepts letters when alphanumeric", async () => {
    const user = userEvent.setup();
    const host = mount('length="4" type="alphanumeric"');
    await user.click(cells()[0]!);
    await user.keyboard("a");
    expect(host.value).toBe("a");
    expect(cells()[0]).toHaveAttribute("inputmode", "text");
  });

  it("clears with Backspace and steps back when empty", async () => {
    const user = userEvent.setup();
    mount('length="4" value="12"');
    await user.click(cells()[2]!);
    await user.keyboard("{Backspace}");
    expect(cells()[1]).toHaveFocus();
    expect(cells()[1]).toHaveValue("");
  });

  it("moves between cells with the arrows, Home and End", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(cells()[0]!);
    await user.keyboard("{ArrowRight}");
    expect(cells()[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(cells()[3]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cells()[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cells()[0]).toHaveFocus();
  });

  it("distributes a pasted code across the cells and completes once", async () => {
    const user = userEvent.setup();
    const host = mount();
    const completions = recorder(host, "complete");
    await user.click(cells()[0]!);
    await user.paste("1234");
    expect(completions).toEqual(["1234"]);
    expect(cells().map((cell) => cell.value)).toEqual(["1", "2", "3", "4"]);
    expect(cells()[3]).toHaveFocus();
  });

  it("reflects a value set from outside without reporting it", () => {
    const host = mount();
    const changes = recorder(host, "change");
    host.value = "98";
    expect(cells().map((cell) => cell.value)).toEqual(["9", "8", "", ""]);
    expect(changes).toEqual([]);
  });

  it("masks the cells and marks the validation states", () => {
    const host = mount('length="4" mask invalid');
    expect(document.querySelectorAll("input[type=password]")).toHaveLength(4);
    const group = document.querySelector(".pin-input")!;
    expect(group).toHaveAttribute("data-invalid");
    expect(group.querySelector(".pin-input__cell")).toHaveAttribute("aria-invalid", "true");
    host.removeAttribute("invalid");
    host.setAttribute("success", "");
    expect(group).not.toHaveAttribute("data-invalid");
    expect(group).toHaveAttribute("data-success");
  });

  it("rebuilds the cells when the length changes", () => {
    const host = mount('length="4" value="1234"');
    host.setAttribute("length", "6");
    expect(cells()).toHaveLength(6);
    expect(cells()[5]).toHaveAccessibleName("Character 6 of 6");
    expect(host.value).toBe("1234");
  });

  it("submits the combined code under its name, and nothing while disabled", () => {
    const host = mount('length="6" name="code" value="123456"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("code")).toBe("123456");
    expect([...new FormData(form).keys()]).toEqual(["code"]);
    host.setAttribute("disabled", "");
    expect([...new FormData(form).keys()]).toEqual([]);
    expect(cells()[0]).toBeDisabled();
  });

  it("restores the current default on form reset, telling nobody", async () => {
    const user = userEvent.setup();
    const host = mount('length="4" name="code" value="12"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    const changes = recorder(host, "change");
    // A value the page sets after mount is the new default.
    host.value = "34";
    await user.click(cells()[2]!);
    await user.keyboard("5");
    expect(new FormData(form).get("code")).toBe("345");
    form.reset();
    await settled();
    expect(new FormData(form).get("code")).toBe("34");
    expect(cells().map((cell) => cell.value)).toEqual(["3", "4", "", ""]);
    expect(host.value).toBe("34");
    expect(changes).toEqual(["345"]);
  });

  it("keeps the default when the page echoes the reported value", async () => {
    const user = userEvent.setup();
    const host = mount('length="4" name="code" value="12"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    host.addEventListener("change", (event) => {
      host.setAttribute("value", (event as CustomEvent<{ value: string }>).detail.value);
    });
    await user.click(cells()[2]!);
    await user.keyboard("3");
    form.reset();
    await settled();
    expect(new FormData(form).get("code")).toBe("12");
  });

  it("restores nothing when the reset is cancelled", async () => {
    const user = userEvent.setup();
    mount('length="4" name="code"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    form.addEventListener("reset", (event) => event.preventDefault());
    await user.click(cells()[0]!);
    await user.keyboard("7");
    form.reset();
    await settled();
    expect(new FormData(form).get("code")).toBe("7");
  });
});
