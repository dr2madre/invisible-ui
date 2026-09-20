import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "./define";

/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (markup: string) => {
  document.body.innerHTML = `<form data-testid="host">${markup}<button type="reset">Reset</button></form>`;
  const form = screen.getByTestId("host") as HTMLFormElement;
  return { form, host: form.firstElementChild as HTMLElement };
};

/** Everything the form would submit under `f`, or null when it sends nothing. */
const payload = (form: HTMLFormElement) => {
  const all = new FormData(form).getAll("f").map(String);
  return all.length === 0 ? null : all.join(",");
};

const defaultsOf = (selector: string, flag: "defaultChecked" | "defaultSelected") =>
  [...document.querySelectorAll<HTMLInputElement | HTMLOptionElement>(selector)]
    .filter((el) => (el as unknown as Record<string, boolean>)[flag])
    .map((el) => (el as HTMLInputElement | HTMLOptionElement).value)
    .join(",");

const options = `<option value="apple">Apple</option><option value="pear">Pear</option>`;

interface Row {
  name: string;
  markup: string;
  /** The DOM default the control carries, in a form the test can compare. */
  domDefault: () => string;
  /** What that default must be at mount, and must stay after an edit. */
  wants: string;
  edit: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  edited: string | null;
  restored: string | null;
  /** The page adopts a value of its own, and what that makes the default. */
  adopt: (host: HTMLElement) => void;
  adopted: string;
  /** The page hands back exactly what the control reported. */
  giveBack: (host: HTMLElement) => void;
  /** What that same write makes the default once it is no longer an echo. */
  editedAsDefault: string;
  /** What the control shows once the reset is done. */
  visible: () => string;
  restoredVisible: string;
  /** The element's own copy of the value, which must come back too. */
  ownCopy: (host: HTMLElement) => string;
  restoredOwnCopy: string;
}

const CONTROLS: Row[] = [
  {
    name: "<ds-text-field>",
    markup: `<ds-text-field label="F" name="f" value="Ada"></ds-text-field>`,
    domDefault: () => (screen.getByRole("textbox", { name: "F" }) as HTMLInputElement).defaultValue,
    wants: "Ada",
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
    adopt: (host) => host.setAttribute("value", "Hopper"),
    adopted: "Hopper",
    giveBack: (host) => host.setAttribute("value", "Grace"),
    editedAsDefault: "Grace",
    visible: () => (screen.getByRole("textbox", { name: "F" }) as HTMLInputElement).value,
    restoredVisible: "Ada",
    ownCopy: (host) => host.getAttribute("value") ?? "",
    restoredOwnCopy: "Ada",
  },
  {
    name: "<ds-textarea>",
    markup: `<ds-textarea label="F" name="f" value="Ada"></ds-textarea>`,
    domDefault: () =>
      (screen.getByRole("textbox", { name: "F" }) as HTMLTextAreaElement).defaultValue,
    wants: "Ada",
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
    adopt: (host) => host.setAttribute("value", "Hopper"),
    adopted: "Hopper",
    giveBack: (host) => host.setAttribute("value", "Grace"),
    editedAsDefault: "Grace",
    visible: () => (screen.getByRole("textbox", { name: "F" }) as HTMLTextAreaElement).value,
    restoredVisible: "Ada",
    ownCopy: (host) => host.getAttribute("value") ?? "",
    restoredOwnCopy: "Ada",
  },
  {
    name: "<ds-checkbox>",
    markup: `<ds-checkbox label="F" name="f" value="on"></ds-checkbox>`,
    domDefault: () => defaultsOf("input[type=checkbox]", "defaultChecked"),
    wants: "",
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
    adopt: (host) => host.removeAttribute("checked"),
    adopted: "",
    giveBack: (host) => host.setAttribute("checked", ""),
    editedAsDefault: "on",
    visible: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).checked),
    restoredVisible: "false",
    ownCopy: (host) => String((host as unknown as { checked: unknown }).checked),
    restoredOwnCopy: "false",
  },
  {
    name: "<ds-switch>",
    markup: `<ds-switch label="F" name="f" checked></ds-switch>`,
    domDefault: () => defaultsOf("input[type=checkbox]", "defaultChecked"),
    wants: "on",
    edit: async (user) => user.click(screen.getByRole("switch", { name: "F" })),
    edited: null,
    restored: "on",
    adopt: (host) => host.setAttribute("checked", ""),
    adopted: "on",
    // Through the property: the edit already took the attribute off, so
    // removing it again would change nothing and prove nothing.
    giveBack: (host) => ((host as unknown as { checked: boolean }).checked = false),
    editedAsDefault: "",
    visible: () => String((screen.getByRole("switch", { name: "F" }) as HTMLInputElement).checked),
    restoredVisible: "true",
    ownCopy: (host) => String((host as unknown as { checked: unknown }).checked),
    restoredOwnCopy: "true",
  },
  {
    name: "<ds-checkbox> that starts on",
    markup: `<ds-checkbox label="F" name="f" value="on" checked></ds-checkbox>`,
    domDefault: () => defaultsOf("input[type=checkbox]", "defaultChecked"),
    wants: "on",
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: null,
    restored: "on",
    adopt: (host) => host.setAttribute("checked", ""),
    adopted: "on",
    // Through the property: the edit already took the attribute off, so
    // removing it again would change nothing and prove nothing.
    giveBack: (host) => ((host as unknown as { checked: unknown }).checked = false),
    editedAsDefault: "",
    visible: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).checked),
    restoredVisible: "true",
    ownCopy: (host) => String((host as unknown as { checked: unknown }).checked),
    restoredOwnCopy: "true",
  },
  {
    name: "<ds-select>",
    // The default is the second option: were `selected` missing, a native
    // reset would land on the first one instead.
    markup: `<ds-select label="F" name="f" value="pear">${options}</ds-select>`,
    domDefault: () => defaultsOf("option", "defaultSelected"),
    wants: "pear",
    edit: async (user) => user.selectOptions(screen.getByRole("combobox", { name: "F" }), "apple"),
    edited: "apple",
    restored: "pear",
    adopt: (host) => host.setAttribute("value", "pear"),
    adopted: "pear",
    giveBack: (host) => host.setAttribute("value", "apple"),
    editedAsDefault: "apple",
    visible: () => (screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement).value,
    restoredVisible: "pear",
    ownCopy: (host) => String((host as unknown as { value: string | null }).value),
    restoredOwnCopy: "pear",
  },
  {
    name: "<ds-radio-group>",
    markup: `<ds-radio-group label="F" name="f" value="apple">${options}</ds-radio-group>`,
    domDefault: () => defaultsOf("input[type=radio]", "defaultChecked"),
    wants: "apple",
    edit: async (user) => user.click(screen.getByRole("radio", { name: "Pear" })),
    edited: "pear",
    restored: "apple",
    adopt: (host) => host.setAttribute("value", "apple"),
    adopted: "apple",
    giveBack: (host) => host.setAttribute("value", "pear"),
    editedAsDefault: "pear",
    visible: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.checked)
        .map((input) => input.value)
        .join(","),
    restoredVisible: "apple",
    ownCopy: (host) => String((host as unknown as { value: string | null }).value),
    restoredOwnCopy: "apple",
  },
  {
    name: "<ds-checkbox-group>",
    markup: `<ds-checkbox-group label="F" name="f" value="apple">${options}</ds-checkbox-group>`,
    domDefault: () => defaultsOf("input[type=checkbox]", "defaultChecked"),
    wants: "apple",
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "Pear" })),
    edited: "apple,pear",
    restored: "apple",
    adopt: (host) => host.setAttribute("value", "pear"),
    adopted: "pear",
    giveBack: (host) => host.setAttribute("value", "apple,pear"),
    editedAsDefault: "apple,pear",
    visible: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=checkbox]")]
        .filter((input) => input.checked)
        .map((input) => input.value)
        .join(","),
    restoredVisible: "apple",
    ownCopy: (host) => (host as unknown as { value: string[] }).value.join(","),
    restoredOwnCopy: "apple",
  },
];

describe.each(CONTROLS)("form reset restores $name", (entry) => {
  it("puts the payload and the page back, and says nothing", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(entry.markup);
    const changes = vi.fn();
    // Both events the elements emit: a text control reports typing as `input`,
    // and its `change` would need a blur the edit never does.
    form.addEventListener("change", changes);
    form.addEventListener("input", changes);

    expect(entry.domDefault(), "the DOM default must be there from the start").toBe(entry.wants);

    await entry.edit(user);
    expect(payload(form)).toBe(entry.edited);
    expect(entry.domDefault(), "the DOM default must not follow the edit").toBe(entry.wants);
    const reported = changes.mock.calls.length;
    expect(reported, "the edit itself must have been reported").toBeGreaterThan(0);

    form.reset();
    await settled();
    expect(payload(form)).toBe(entry.restored);
    expect(entry.visible(), "the page must agree with the payload").toBe(entry.restoredVisible);
    // ADR 0012: the restore puts the element's own copy back too. The browser
    // puts the inner control back by itself, so a control that was never told
    // looks right and holds the edit, until the next unrelated sync.
    expect(entry.ownCopy(host), "the control's own copy must come back too").toBe(
      entry.restoredOwnCopy,
    );
    // What a stale copy costs: the next unrelated change re-renders from it
    // and the edit comes back, long after the reset.
    host.setAttribute("label", "F ");
    expect(payload(form), "an unrelated change brought the edit back").toBe(entry.restored);
    host.setAttribute("label", "F");
    expect(changes.mock.calls.length, "a reset is not a user change").toBe(reported);

    // The page hands back exactly what the control reported. That is an echo,
    // not a new default, so a second reset lands in the same place.
    await entry.edit(user);
    entry.giveBack(host);
    expect(entry.domDefault(), "an echo became the default").toBe(entry.wants);
    form.reset();
    await settled();
    expect(payload(form)).toBe(entry.restored);

    // The same write again, now that the reset has taken that value off the
    // control: nothing is echoed, so it is the page's own choice.
    entry.giveBack(host);
    expect(entry.domDefault(), "a choice made after a reset was read as an echo").toBe(
      entry.editedAsDefault,
    );

    // A value the page chooses for itself is a new default, and a reset after
    // it lands there.
    entry.adopt(host);
    expect(entry.domDefault(), "the adopted value did not become the default").toBe(entry.adopted);
  });

  it("restores nothing when the reset is cancelled", async () => {
    const user = userEvent.setup();
    const { form } = mount(entry.markup);
    form.addEventListener("reset", (event) => event.preventDefault());

    await entry.edit(user);
    form.reset();
    await settled();
    expect(payload(form), "a cancelled reset must leave the edit alone").toBe(entry.edited);
  });

  it("takes its listener off the document when it leaves the page", () => {
    const added = vi.spyOn(document, "addEventListener");
    const removed = vi.spyOn(document, "removeEventListener");
    const resets = (spy: typeof added) =>
      spy.mock.calls.filter(([type]) => type === "reset").length;
    try {
      // Deltas, not totals: replacing the page's markup tears down whatever
      // the previous test left behind, and that removal is not this one's.
      const { host } = mount(entry.markup);
      const mounted = { added: resets(added), removed: resets(removed) };
      expect(mounted.added, "the control must listen while it is in the page").toBe(1);
      host.remove();
      expect(resets(removed) - mounted.removed, "the listener outlived the control").toBe(1);
    } finally {
      added.mockRestore();
      removed.mockRestore();
    }
  });

  it("follows the form it is in now, not the one it started in", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(entry.markup);
    const second = document.createElement("form");
    second.dataset.testid = "second";
    document.body.appendChild(second);

    // Moved into another form: the listener went with the removal and is set
    // up again on the way in, and the owner is read when the reset happens.
    host.remove();
    second.appendChild(host);

    await entry.edit(user);
    expect(payload(second)).toBe(entry.edited);

    // The form it left must not be able to restore it any more.
    form.reset();
    await settled();
    expect(payload(second), "the old form still moved the control").toBe(entry.edited);

    second.reset();
    await settled();
    expect(payload(second), "the control ignored the form it is in now").toBe(entry.restored);
  });
});

// The composite families carry their payload in hidden inputs, which a form
// reset never touches: theirs comes back only because the control was told.
describe("form reset restores the composite families", () => {
  it.each([
    { name: "<ds-combobox>", markup: `<ds-combobox label="F" name="f">${options}</ds-combobox>` },
    {
      name: "<ds-multi-select>",
      markup: `<ds-multi-select label="F" name="f">${options}</ds-multi-select>`,
    },
  ])("$name takes its listener off the document when it leaves the page", ({ markup }) => {
    const added = vi.spyOn(document, "addEventListener");
    const removed = vi.spyOn(document, "removeEventListener");
    const resets = (spy: typeof added) =>
      spy.mock.calls.filter(([type]) => type === "reset").length;
    try {
      const { host } = mount(markup);
      const mounted = resets(removed);
      expect(resets(added), "the control must listen while it is in the page").toBe(1);
      host.remove();
      expect(resets(removed) - mounted, "the listener outlived the control").toBe(1);
    } finally {
      added.mockRestore();
      removed.mockRestore();
    }
  });

  it("puts <ds-combobox> back to the current default", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(
      `<ds-combobox label="F" name="f" value="pear">${options}</ds-combobox>`,
    );
    const changes = vi.fn();
    form.addEventListener("change", changes);
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    expect(input().value).toBe("Pear");

    await user.click(input());
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Apple" }));
    expect(payload(form)).toBe("apple");
    const reported = changes.mock.calls.length;
    expect(reported).toBeGreaterThan(0);

    form.reset();
    await settled();
    expect(payload(form)).toBe("pear");
    expect(input().value, "the text must agree with the payload").toBe("Pear");
    expect(changes.mock.calls.length, "a reset is not a user change").toBe(reported);

    host.setAttribute("value", "apple");
    form.reset();
    await settled();
    expect(payload(form), "a value the page chose is the new default").toBe("apple");
  });

  it("puts <ds-multi-select> back to the current default", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(
      `<ds-multi-select label="F" name="f" values="pear">${options}</ds-multi-select>`,
    );
    const changes = vi.fn();
    form.addEventListener("change", changes);

    expect(payload(form)).toBe("pear");

    await user.click(screen.getByRole("combobox", { name: "F" }));
    await user.keyboard("{ArrowDown}{Enter}");
    const edited = payload(form);
    expect(edited).not.toBe("pear");
    const reported = changes.mock.calls.length;
    expect(reported).toBeGreaterThan(0);

    form.reset();
    await settled();
    expect(payload(form)).toBe("pear");
    expect(
      (host as unknown as { values: string[] }).values,
      "the control's own copy must come back too",
    ).toEqual(["pear"]);
    expect(changes.mock.calls.length, "a reset is not a user change").toBe(reported);

    host.setAttribute("values", "apple pear");
    form.reset();
    await settled();
    expect(payload(form), "a value the page chose is the new default").toBe("apple,pear");
  });
});

// Four ways the current default went wrong before, each found by review and
// each reproduced here first. They are about paths the table above does not
// walk: a second write from the page, a control with a state no attribute can
// hold, an option list rebuilt under a live selection, and a query left in the
// box after the selection came back.
describe("the current default under a page that keeps writing", () => {
  it("takes a value the page sets after another one as its own choice", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(`<ds-text-field label="F" name="f" value="Ada"></ds-text-field>`);
    const input = screen.getByRole("textbox", { name: "F" });

    await user.clear(input);
    await user.type(input, "Grace");
    // The page changes its mind twice. The second write lands on the value the
    // user typed, but the control no longer holds "Grace": it holds "Hopper",
    // which the page itself put there, so this is a choice and not an echo.
    host.setAttribute("value", "Hopper");
    host.setAttribute("value", "Grace");

    form.reset();
    await settled();
    expect(payload(form)).toBe("Grace");
  });

  it("still takes a value the page hands straight back as an echo", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(`<ds-text-field label="F" name="f" value="Ada"></ds-text-field>`);
    const input = screen.getByRole("textbox", { name: "F" });

    await user.clear(input);
    await user.type(input, "Grace");
    host.setAttribute("value", "Grace");

    form.reset();
    await settled();
    expect(payload(form), "an echo must not become the default").toBe("Ada");
  });

  it("keeps an indeterminate default across a click on <ds-checkbox>", async () => {
    const user = userEvent.setup();
    const { form } = mount(
      `<ds-checkbox label="F" name="f" value="on" indeterminate></ds-checkbox>`,
    );
    const box = () => screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement;
    expect(box().indeterminate).toBe(true);

    // Clicking an indeterminate box checks it and clears the third state. The
    // two attributes that hold that state are written one after the other, and
    // the moment between them is not a state the page ever asked for.
    await user.click(box());
    form.reset();
    await settled();

    expect(box().indeterminate, "the third state was the default, and must come back").toBe(true);
    expect(payload(form)).toBe(null);
  });

  it("leaves the selection alone when <ds-select> is given its list again", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(
      `<ds-select label="F" name="f" value="pear">${options}</ds-select>`,
    );
    const select = () => screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement;
    await user.selectOptions(select(), "apple");

    // A rebuilt list starts with no option marked as chosen, so writing the
    // defaults into it moves the selection unless the value is asserted after.
    (host as unknown as { items: { value: string; label: string }[] }).items = [
      { value: "apple", label: "Apple" },
      { value: "pear", label: "Pear" },
    ];

    expect(select().value, "the list rebuild moved the selection").toBe("apple");
    expect(payload(form), "the form would submit a value nobody chose").toBe("apple");
    expect((host as unknown as { value: string | null }).value).toBe("apple");
  });

  it("clears the query <ds-multi-select> was typing when the form resets", async () => {
    const user = userEvent.setup();
    const { form } = mount(
      `<ds-multi-select label="F" name="f" values="pear">${options}</ds-multi-select>`,
    );
    const input = screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    await user.click(input);
    await user.keyboard("App");
    expect(input.value).toBe("App");

    form.reset();
    // The browser empties the box as part of the reset; the restore that
    // follows must not type the query back into it.
    expect(input.value, "the browser's own reset must have emptied it").toBe("");
    await settled();
    expect(input.value, "the restore typed the query back in").toBe("");
    expect(payload(form)).toBe("pear");
  });
});

// The public property is the other way a page writes these controls, and the
// combobox keeps one more piece of state than the others.
describe("the current default through the other public paths", () => {
  it("takes a value set through the property as the page's own choice", async () => {
    const user = userEvent.setup();
    const { form, host } = mount(`<ds-text-field label="F" name="f" value="Ada"></ds-text-field>`);
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "F" });

    await user.clear(input);
    await user.type(input, "Grace");
    (host as unknown as { value: string }).value = "Hopper";

    form.reset();
    await settled();
    expect(payload(form), "a write through the property is a choice").toBe("Hopper");
    expect(input.value).toBe("Hopper");
  });

  it("settles <ds-combobox> on what the reset put there, not on what it replaced", async () => {
    const user = userEvent.setup();
    const { form } = mount(`<ds-combobox label="F" name="f" value="pear">${options}</ds-combobox>`);
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    await user.click(input());
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Apple" }));
    expect(input().value).toBe("Apple");

    form.reset();
    await settled();
    expect(input().value).toBe("Pear");

    // Escape abandons what is being typed and goes back to the selection the
    // control last settled on. After a reset that is the restored one: the
    // reset moved the whole of the control's state, not only what shows.
    await user.click(input());
    await user.keyboard("xyz");
    await user.keyboard("{Escape}");
    expect(input().value, "Escape went back to the value the reset undid").toBe("Pear");
    expect(payload(form)).toBe("pear");
  });
});
