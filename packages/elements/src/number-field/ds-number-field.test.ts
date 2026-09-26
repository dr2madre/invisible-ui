import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsNumberField } from "./ds-number-field";

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (attributes = "", wrap = (html: string) => html) => {
  document.body.innerHTML = wrap(
    `<ds-number-field label="Amount" ${attributes}></ds-number-field>`,
  );
  return document.querySelector("ds-number-field") as DsNumberField;
};

const IT = {
  "numberField.increment": "Aumenta {label}",
  "numberField.decrement": "Diminuisci {label}",
  "numberField.rangeOverflow": "Inserisci un numero non superiore a {max}.",
} as const;

/** An Italian provider whose overrides are set before the field renders its labels. */
const inItalian = (attributes = "", locale = "it") => {
  const host = mount(
    attributes,
    (html) => `<ds-locale-provider locale="${locale}">${html}</ds-locale-provider>`,
  );
  (document.querySelector("ds-locale-provider") as unknown as { messages: object }).messages = IT;
  return host;
};

const input = (name = "Amount") => screen.getByRole("spinbutton", { name }) as HTMLInputElement;
const increment = (name = "Increase Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;
const decrement = (name = "Decrease Amount") =>
  screen.getByRole("button", { name }) as HTMLButtonElement;

const recorder = (host: HTMLElement, type: "input" | "change") => {
  const seen: Array<number | null> = [];
  host.addEventListener(type, (event) => seen.push((event as CustomEvent).detail.value));
  return seen;
};

describe("<ds-number-field>", () => {
  it("renders a named spinbutton with the value formatted in the element's locale", async () => {
    mount('value="12345.5"', (html) => `<div lang="it">${html}</div>`);
    expect(input().value).toBe("12.345,5");
    expect(input()).toHaveAttribute("inputmode", "decimal");
    expect(input()).toHaveAttribute("type", "text");
    expect(input()).toHaveAttribute("aria-valuenow", "12345.5");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("parses the decimal comma of an it provider", async () => {
    const host = inItalian('step="0.5"', "it-IT");
    const changes = recorder(host, "input");
    await fireEvent.input(input(), { target: { value: "12345,5" } });
    expect(changes).toEqual([12345.5]);
    expect(host.value).toBe(12345.5);
    expect(host.getAttribute("value")).toBe("12345.5");
  });

  it("keeps a transient draft as typed, without premature formatting", async () => {
    mount('locale="it-IT" step="0.5"');
    await fireEvent.input(input(), { target: { value: "12," } });
    expect(input().value).toBe("12,");
    expect(input()).toHaveAttribute("data-state", "incomplete");
  });

  it("emits one input per edit and one change on blur, reformatting", async () => {
    const host = mount('locale="it-IT" step="0.5"');
    const edits = recorder(host, "input");
    const commits = recorder(host, "change");
    await fireEvent.input(input(), { target: { value: "12345,5" } });
    expect(edits).toEqual([12345.5]);
    expect(commits).toEqual([]);
    await fireEvent.blur(input());
    expect(commits).toEqual([12345.5]);
    expect(input().value).toBe("12.345,5");
    await fireEvent.blur(input());
    expect(commits).toHaveLength(1);
  });

  it("reflects a value set from outside without emitting, and ignores an echo", async () => {
    const host = mount('value="5"');
    const edits = recorder(host, "input");
    const commits = recorder(host, "change");
    host.value = 9;
    expect(input().value).toBe("9");
    expect(edits).toEqual([]);
    expect(commits).toEqual([]);
    await fireEvent.input(input(), { target: { value: "7" } });
    expect(edits).toEqual([7]);
    host.setAttribute("value", "7");
    expect(edits).toEqual([7]);
    expect(input().value).toBe("7");
  });

  it("keeps a focused draft when the page sets a value", async () => {
    const host = mount('value="5"');
    input().focus();
    await fireEvent.input(input(), { target: { value: "7." } });
    host.value = 100;
    expect(input().value).toBe("7.");
    expect(input()).toHaveAttribute("aria-valuenow", "100");
  });

  it("steps with the buttons, names them per label, commits each spin", async () => {
    const user = userEvent.setup();
    const host = mount('value="2" step="0.5"');
    const commits = recorder(host, "change");
    expect(increment()).toHaveAttribute("tabindex", "-1");
    await user.click(increment());
    expect(input().value).toBe("2.5");
    await user.click(decrement());
    expect(input().value).toBe("2");
    expect(commits).toEqual([2.5, 2]);
  });

  it("steps from the keyboard and jumps to the bounds with Home and End", async () => {
    const user = userEvent.setup();
    mount('value="5" min="0" max="10"');
    await user.click(input());
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("6");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input().value).toBe("4");
    await user.keyboard("{End}");
    expect(input().value).toBe("10");
    expect(increment()).toBeDisabled();
    await user.keyboard("{Home}");
    expect(input().value).toBe("0");
    expect(decrement()).toBeDisabled();
  });

  it("restores the committed value on Escape", async () => {
    const user = userEvent.setup();
    mount('value="5"');
    await user.click(input());
    await user.clear(input());
    await user.keyboard("8{Escape}");
    expect(input().value).toBe("5");
  });

  it("shows a localized validation message for a typed violation", async () => {
    inItalian('max="10000"');
    await fireEvent.input(input(), { target: { value: "99999" } });
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Inserisci un numero non superiore a 10.000.")).toBeVisible();
  });

  it("names the spin buttons from the catalog, and a label attribute wins", () => {
    const host = inItalian();
    expect(screen.getByRole("button", { name: "Aumenta Amount" })).toBeInTheDocument();
    host.setAttribute("increment-label", "Add one");
    expect(screen.getByRole("button", { name: "Add one" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuisci Amount" })).toBeInTheDocument();
  });

  it("follows a provider's locale change, reformatting an idle display silently", async () => {
    const host = inItalian('value="12345.5"', "en");
    const edits = recorder(host, "input");
    expect(input().value).toBe("12,345.5");
    document.querySelector("ds-locale-provider")!.setAttribute("locale", "it-IT");
    expect(input().value).toBe("12.345,5");
    expect(screen.getByRole("button", { name: "Aumenta Amount" })).toBeInTheDocument();
    expect(edits).toEqual([]);
  });

  it("keeps an unfocused invalid draft across a locale change", async () => {
    const host = mount('value="5" locale="en"');
    await fireEvent.input(input(), { target: { value: "1..2" } });
    await fireEvent.blur(input());
    expect(input().value).toBe("1..2");
    host.setAttribute("locale", "it-IT");
    expect(input().value).toBe("1..2");
  });

  it("keeps a consumer error safe, described, and announced", () => {
    mount('error="<script>bad()</script>" description="Helpful hint"');
    const ids = (input().getAttribute("aria-describedby") ?? "").split(" ");
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(ids).toHaveLength(2);
    const error = document.getElementById(ids[1]!)!;
    expect(error.textContent).toBe("<script>bad()</script>");
    expect(error.querySelector("script")).toBeNull();
    expect(error).toHaveAttribute("role", "alert");
    expect(document.getElementById(ids[0]!)!.textContent).toBe("Helpful hint");
  });

  it("blocks editing when disabled or read-only", async () => {
    const host = mount('value="5" disabled');
    const edits = recorder(host, "input");
    expect(input()).toBeDisabled();
    expect(increment()).toBeDisabled();
    host.removeAttribute("disabled");
    host.setAttribute("readonly", "");
    expect(input()).toHaveAttribute("readonly");
    await fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(edits).toEqual([]);
  });

  it("gives sibling fields distinct ids and wiring", () => {
    document.body.innerHTML = `
      <ds-number-field label="Amount"></ds-number-field>
      <ds-number-field label="Other"></ds-number-field>`;
    const first = input();
    const other = input("Other");
    expect(first.id).not.toBe(other.id);
    expect(screen.getByText("Other").closest("label")).toHaveAttribute("for", other.id);
  });

  it("submits the canonical ASCII value and omits it when disabled", () => {
    const host = mount(
      'name="amount" value="1234.5" locale="it"',
      (html) => `<form>${html}</form>`,
    );
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("amount")).toBe("1234.5");
    expect(input().value).toBe("1234,5");
    host.setAttribute("disabled", "");
    expect(new FormData(form).has("amount")).toBe(false);
  });

  it("belongs to a form it names from outside, and that form's reset restores it", async () => {
    document.body.innerHTML = `
      <form id="owner"></form>
      <ds-number-field label="Outside" name="outside" value="2" form="owner"></ds-number-field>`;
    const owner = document.querySelector("form")!;
    expect(new FormData(owner).get("outside")).toBe("2");
    await fireEvent.input(input("Outside"), { target: { value: "9" } });
    expect(new FormData(owner).get("outside")).toBe("9");
    owner.reset();
    await settled();
    expect(new FormData(owner).get("outside")).toBe("2");
    expect(input("Outside").value).toBe("2");
  });

  it("restores the current default on form reset, telling nobody", async () => {
    const host = mount('name="amount" value="10"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    const edits = recorder(host, "input");
    // The page moves the value after mount: the default moves with it.
    host.value = 25;
    await fireEvent.input(input(), { target: { value: "77" } });
    expect(edits).toEqual([77]);
    form.reset();
    await settled();
    expect(new FormData(form).get("amount")).toBe("25");
    expect(input().value).toBe("25");
    expect(host.value).toBe(25);
    expect(edits).toHaveLength(1);
  });

  it("restores nothing when the reset is cancelled", async () => {
    mount('name="amount" value="10"', (html) => `<form>${html}</form>`);
    const form = document.querySelector("form")!;
    await fireEvent.input(input(), { target: { value: "77" } });
    form.ownerDocument.addEventListener("reset", (event) => event.preventDefault(), {
      once: true,
    });
    form.reset();
    await settled();
    expect(input().value).toBe("77");
  });

  it("takes its reset listener off the document when it leaves the page", () => {
    const removed = vi.spyOn(document, "removeEventListener");
    try {
      const host = mount('name="amount"', (html) => `<form>${html}</form>`);
      const before = removed.mock.calls.filter(([type]) => type === "reset").length;
      host.remove();
      expect(removed.mock.calls.filter(([type]) => type === "reset").length - before).toBe(1);
    } finally {
      removed.mockRestore();
    }
  });
});
