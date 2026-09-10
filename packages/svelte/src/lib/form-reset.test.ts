import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Checkbox from "./checkbox/Checkbox.svelte";
import Select from "./select/Select.svelte";
import Slider from "./slider/Slider.svelte";
import Switch from "./switch/Switch.svelte";
import TextField from "./text-field/TextField.svelte";
import Textarea from "./text-field/Textarea.svelte";
import ToggleButton from "./toggle-button/ToggleButton.svelte";
import CheckboxGroup from "./checkbox-group/CheckboxGroup.svelte";
import RadioGroup from "./radio-group/RadioGroup.svelte";
import RatingGroup from "./rating-group/RatingGroup.svelte";
import SegmentedControl from "./segmented-control/SegmentedControl.svelte";
import EchoFixture from "./form-reset.fixture.svelte";
import ComposedFixture from "./form-composition.fixture.svelte";
import PinInput from "./pin-input/PinInput.svelte";
import DateRangePicker from "./date-range-picker/DateRangePicker.svelte";

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A calendar day, addressed by its ISO date. */
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

type Entry = {
  name: string;
  component: unknown;
  props: Record<string, unknown>;
  /** Drive one committed user edit. */
  edit: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  /** The payload under "f" after the edit, and after a reset. */
  edited: string | null;
  restored: string | null;
  /** How to read the payload; groups submit several values under one name. */
  payload?: (form: HTMLFormElement) => string | null;
  /** What the page shows after the reset. */
  shows: string;
  /** The DOM default the control must carry, before and after the edit. */
  domDefault: () => string;
  wants: string;
  /** Read what the page shows. */
  visible: () => string;
};

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];

// One row per control: a reset restores the payload and the visible state,
// and reports nothing. The deeper rules (a moved default, a cancelled reset,
// teardown, give-back) are held on the TextField pilot above, which shares
// the same helper and the same shape.
const CONTROLS: Entry[] = [
  {
    name: "TextField",
    wants: "Ada",
    component: TextField,
    props: { label: "F", name: "f", value: "Ada" },
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
    shows: "Ada",
    domDefault: () => (screen.getByRole("textbox", { name: "F" }) as HTMLInputElement).defaultValue,
    visible: () => (screen.getByRole("textbox", { name: "F" }) as HTMLInputElement).value,
  },
  {
    name: "Textarea",
    wants: "Ada",
    component: Textarea,
    props: { label: "F", name: "f", value: "Ada" },
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
    shows: "Ada",
    domDefault: () =>
      (screen.getByRole("textbox", { name: "F" }) as HTMLTextAreaElement).defaultValue,
    visible: () => (screen.getByRole("textbox", { name: "F" }) as HTMLTextAreaElement).value,
  },
  {
    name: "Checkbox",
    wants: "false",
    component: Checkbox,
    props: { label: "F", name: "f", checked: false },
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
    shows: "false unchecked",
    domDefault: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).defaultChecked),
    // The property and the machine-driven presentation together: native alone
    // restores the first, only the told machine restores the second.
    visible: () => {
      const input = screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement;
      return `${input.checked} ${input.dataset.state}`;
    },
  },
  {
    name: "Switch",
    wants: "true",
    component: Switch,
    props: { label: "F", name: "f", checked: true },
    edit: async (user) => user.click(screen.getByRole("switch", { name: "F" })),
    edited: null,
    restored: "on",
    shows: "true checked",
    domDefault: () =>
      String((screen.getByRole("switch", { name: "F" }) as HTMLInputElement).defaultChecked),
    visible: () => {
      const input = screen.getByRole("switch", { name: "F" }) as HTMLInputElement;
      return `${input.checked} ${input.dataset.state}`;
    },
  },
  {
    name: "ToggleButton",
    wants: "false",
    component: ToggleButton,
    props: { label: "F", name: "f", pressed: false },
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
    shows: "false",
    domDefault: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).defaultChecked),
    visible: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).checked),
  },
  {
    name: "Slider",
    wants: "30",
    component: Slider,
    props: { label: "F", name: "f", value: 30, min: 0, max: 100 },
    edit: async () => {
      const input = screen.getByRole("slider", { name: "F" }) as HTMLInputElement;
      input.value = "70";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    edited: "70",
    restored: "30",
    shows: "30",
    domDefault: () =>
      (screen.getByRole("slider", { name: "F" }) as HTMLInputElement).getAttribute("value") ?? "",
    visible: () => (screen.getByRole("slider", { name: "F" }) as HTMLInputElement).value,
  },
  {
    name: "Select",
    wants: "pear",
    component: Select,
    // The default is the second option: were the selected attribute missing,
    // a native reset would land on the first.
    props: { label: "F", name: "f", value: "pear", items: fruit },
    edit: async (user) => user.selectOptions(screen.getByRole("combobox", { name: "F" }), "apple"),
    edited: "apple",
    restored: "pear",
    shows: "pear",
    domDefault: () =>
      [...(screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement).options]
        .filter((option) => option.defaultSelected)
        .map((option) => option.value)
        .join(","),
    visible: () => (screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement).value,
  },
  {
    name: "RadioGroup",
    component: RadioGroup,
    wants: "a",
    props: { label: "F", name: "f", value: "a", items: [{ value: "a" }, { value: "b" }] },
    edit: async (user) => user.click(screen.getByRole("radio", { name: "b" })),
    edited: "b",
    restored: "a",
    shows: "true checked",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    visible: () => {
      const input = screen.getByRole("radio", { name: "a" }) as HTMLInputElement;
      return `${input.checked} ${input.dataset.state}`;
    },
  },
  {
    name: "SegmentedControl",
    component: SegmentedControl,
    wants: "a",
    props: { label: "F", name: "f", value: "a", items: [{ value: "a" }, { value: "b" }] },
    edit: async (user) => user.click(screen.getByRole("radio", { name: "b" })),
    edited: "b",
    restored: "a",
    shows: "true checked",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    visible: () => {
      const input = screen.getByRole("radio", { name: "a" }) as HTMLInputElement;
      return `${input.checked} ${input.dataset.state}`;
    },
  },
  {
    name: "CheckboxGroup",
    component: CheckboxGroup,
    wants: "a",
    props: { label: "F", name: "f", value: ["a"], items: [{ value: "a" }, { value: "b" }] },
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "b" })),
    edited: "a,b",
    restored: "a",
    payload: (form) => {
      const all = new FormData(form).getAll("f");
      return all.length ? all.join(",") : null;
    },
    shows: "false unchecked",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=checkbox]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    visible: () => {
      const input = screen.getByRole("checkbox", { name: "b" }) as HTMLInputElement;
      return `${input.checked} ${input.dataset.state}`;
    },
  },
  {
    name: "RatingGroup",
    component: RatingGroup,
    wants: "2",
    props: { label: "F", name: "f", value: 2, max: 5 },
    edit: async (user) => user.click(screen.getByRole("radio", { name: "4 stars" })),
    edited: "4",
    restored: "2",
    shows: "true",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    visible: () =>
      String((screen.getByRole("radio", { name: "2 stars" }) as HTMLInputElement).checked),
  },
];

describe.each(CONTROLS)("form reset restores $name", (entry) => {
  it("puts the payload and the page back, and reports nothing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    const onPressedChange = vi.fn();
    const rendered = render(entry.component as never, {
      props: { ...entry.props, onValueChange, onCheckedChange, onPressedChange } as never,
    });
    const form = document.createElement("form");
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);

    expect(entry.domDefault(), "the DOM default must be there from the start").toBe(entry.wants);
    const payload =
      entry.payload ?? ((host: HTMLFormElement) => new FormData(host).get("f") as string | null);
    await entry.edit(user);
    expect(payload(form)).toBe(entry.edited);
    expect(entry.domDefault(), "the DOM default must not follow the edit").toBe(entry.wants);
    const reported =
      onValueChange.mock.calls.length +
      onCheckedChange.mock.calls.length +
      onPressedChange.mock.calls.length;
    expect(reported, "the edit itself must have been reported").toBeGreaterThan(0);

    form.reset();
    await settled();
    expect(payload(form)).toBe(entry.restored);
    expect(entry.visible(), "the page must show the restored state").toBe(entry.shows);
    const after =
      onValueChange.mock.calls.length +
      onCheckedChange.mock.calls.length +
      onPressedChange.mock.calls.length;
    expect(after, "a reset is not a user change").toBe(reported);
  });
});

describe("form reset across the composed form", () => {
  it("every family comes back: the whole payload equals the mount payload", async () => {
    const user = userEvent.setup();
    render(ComposedFixture);
    const form = screen.getByTestId("composed-form") as HTMLFormElement;
    const payload = () =>
      Object.fromEntries(
        ["name", "subscribe", "country", "fruit", "amount", "time", "due"].map((key) => [
          key,
          new FormData(form).get(key),
        ]),
      );
    const skills = () => new FormData(form).getAll("skills").join(",");
    const mount = payload();
    expect(mount).toEqual({
      name: "Ada",
      subscribe: "yes",
      country: "it",
      fruit: "pear",
      amount: "1234.5",
      time: "09:30",
      due: "2026-06-15",
    });
    expect(skills()).toBe("svelte,vue");

    // One committed edit per family.
    const name = screen.getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Grace");
    await user.click(screen.getByRole("checkbox", { name: "Subscribe" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Country" }), "fr");
    const fruit = screen.getByRole("combobox", { name: "Fruit" });
    await user.clear(fruit);
    await user.type(fruit, "App");
    await user.click(screen.getByRole("option", { name: /Apple/ }));
    const skillsInput = screen.getByRole("combobox", { name: "Skills" });
    await user.click(skillsInput);
    await user.click(screen.getByRole("option", { name: "React" }));
    const amount = screen.getByRole("spinbutton", { name: "Amount" });
    await user.clear(amount);
    await user.type(amount, "7");
    const hour = screen.getAllByRole("spinbutton", { name: /hour/i })[0];
    hour.focus();
    await user.keyboard("{ArrowUp}");
    await user.click(screen.getByRole("combobox", { name: "Due date" }));
    await user.click(dayButton("2026-06-20"));

    expect(payload()).toEqual({
      name: "Grace",
      subscribe: null,
      country: "fr",
      fruit: "apple",
      amount: "7",
      time: "10:30",
      due: "2026-06-20",
    });
    expect(skills()).toBe("svelte,vue,react");

    form.reset();
    await settled();
    expect(payload(), "the whole form is back where it mounted").toEqual(mount);
    expect(skills()).toBe("svelte,vue");

    // The committed text came back too: an Escape after the reset settles on
    // the restored label, not on the one the reset replaced.
    await user.clear(fruit);
    await user.type(fruit, "zzz");
    await user.keyboard("{Escape}");
    expect((fruit as HTMLInputElement).value).toBe("Pear");
  });
});

describe("form reset on the remaining composites", () => {
  const wrap = (rendered: { container: HTMLElement }) => {
    const form = document.createElement("form");
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);
    return form;
  };

  it("PinInput comes back to the split default", async () => {
    const user = userEvent.setup();
    const rendered = render(PinInput, {
      props: { label: "Code", name: "pin", length: 4, value: "1234" },
    });
    const form = wrap(rendered);
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]);
    await user.keyboard("{Backspace}9");
    expect(new FormData(form).get("pin")).not.toBe("1234");

    form.reset();
    await settled();
    expect(new FormData(form).get("pin")).toBe("1234");
    expect((cells[0] as HTMLInputElement).value).toBe("1");
  });

  it("DateRangePicker brings both ends back", async () => {
    const user = userEvent.setup();
    const rendered = render(DateRangePicker, {
      props: {
        label: "Window",
        startName: "from",
        endName: "to",
        start: "2026-06-01",
        end: "2026-06-10",
      },
    });
    const form = wrap(rendered);
    await user.click(screen.getByRole("combobox", { name: "Window" }));
    await user.click(dayButton("2026-06-15"));
    await user.click(dayButton("2026-06-20"));
    const edited = new FormData(form);
    expect(edited.get("from")).toBe("2026-06-15");
    expect(edited.get("to")).toBe("2026-06-20");

    form.reset();
    await settled();
    const restored = new FormData(form);
    expect(restored.get("from")).toBe("2026-06-01");
    expect(restored.get("to")).toBe("2026-06-10");
  });
});

describe("form reset under a controlled echo", () => {
  it("an echoed report never moves a default, and a reset undoes every edit", async () => {
    const user = userEvent.setup();
    render(EchoFixture);
    const form = screen.getByTestId("echo-form") as HTMLFormElement;

    const initial = {
      text: "Ada",
      check: null,
      switch: "on",
      toggle: null,
      slide: "30",
      fruit: "pear",
      group: "a",
      boxes: "a",
      segment: "a",
      stars: "2",
      lone: "x",
    };
    const payload = () => {
      const data = new FormData(form);
      return Object.fromEntries(
        Object.keys(initial).map((key) => {
          const all = data.getAll(key);
          return [key, all.length ? all.join(",") : null];
        }),
      );
    };
    expect(payload()).toEqual(initial);

    // One committed edit per control; every report echoes into its prop.
    const textbox = screen.getByRole("textbox", { name: "Text" });
    await user.clear(textbox);
    await user.type(textbox, "Grace");
    await user.click(screen.getByRole("checkbox", { name: "Check" }));
    await user.click(screen.getByRole("switch", { name: "Switch" }));
    await user.click(screen.getByRole("checkbox", { name: "Toggle" }));
    const range = screen.getByRole("slider", { name: "Slide" }) as HTMLInputElement;
    range.value = "70";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Fruit" }), "apple");
    await user.click(
      within(screen.getByRole("radiogroup", { name: "Group" })).getByRole("radio", { name: "b" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "b" }));
    await user.click(
      within(screen.getByRole("radiogroup", { name: "Segment" })).getByRole("radio", { name: "b" }),
    );
    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    await user.click(screen.getByRole("radio", { name: "Lone Y" }));

    expect(payload()).toEqual({
      text: "Grace",
      check: "on",
      switch: null,
      toggle: "on",
      slide: "70",
      fruit: "apple",
      group: "b",
      boxes: "a,b",
      segment: "b",
      stars: "4",
      lone: "y",
    });

    form.reset();
    await settled();
    // Every default survived its own echo: the whole form is back where the
    // consumer put it.
    expect(payload()).toEqual(initial);
  });
});

describe("form reset on standalone radios", () => {
  it("the checked attribute is the default, and it does not follow the edit", async () => {
    const user = userEvent.setup();
    render(EchoFixture);
    const first = screen.getByRole("radio", { name: "Lone X" }) as HTMLInputElement;
    expect(first.defaultChecked).toBe(true);
    await user.click(screen.getByRole("radio", { name: "Lone Y" }));
    expect(first.checked).toBe(false);
    expect(first.defaultChecked, "the DOM default must not follow the edit").toBe(true);
  });
});

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
