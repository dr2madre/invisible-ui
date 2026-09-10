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
import TimeField from "./time-field/TimeField.svelte";
import MultiSelect from "./multi-select/MultiSelect.svelte";

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
    // `check` renders the machine-driven glyph, which is the surface this row
    // reads: without it there is nothing but native's own checkedness.
    props: { label: "F", name: "f", pressed: false, check: true },
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
    shows: "false 0",
    domDefault: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).defaultChecked),
    // The checkedness is native's to restore; the check glyph is the
    // machine's, so reading both is what tells the two layers apart.
    visible: () => {
      const input = screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement;
      return `${input.checked} ${document.querySelectorAll(".toggle__check").length}`;
    },
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
    shows: "30 30%",
    domDefault: () =>
      (screen.getByRole("slider", { name: "F" }) as HTMLInputElement).getAttribute("value") ?? "",
    // The value is native's to restore; the fill percentage is the machine's.
    visible: () => {
      const input = screen.getByRole("slider", { name: "F" }) as HTMLInputElement;
      const track = document.querySelector<HTMLElement>("[style*='--_slider-pct']")!;
      return `${input.value} ${track.style.getPropertyValue("--_slider-pct")}`;
    },
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
    edit: async (user) => {
      const star = screen.getByRole("radio", { name: "4 stars" });
      await user.click(star);
      // The hover preview replaces the fill while the pointer is on a star.
      await user.unhover(star);
    },
    edited: "4",
    restored: "2",
    shows: "true 2",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    // The checkedness is native's to restore; the filled stars are the
    // machine's.
    visible: () => {
      const input = screen.getByRole("radio", { name: "2 stars" }) as HTMLInputElement;
      return `${input.checked} ${document.querySelectorAll(".rating__star--filled").length}`;
    },
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
    const inForm = within(form);

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
    const textbox = inForm.getByRole("textbox", { name: "Text" });
    await user.clear(textbox);
    await user.type(textbox, "Grace");
    await user.click(inForm.getByRole("checkbox", { name: "Check" }));
    await user.click(inForm.getByRole("switch", { name: "Switch" }));
    await user.click(inForm.getByRole("checkbox", { name: "Toggle" }));
    const range = inForm.getByRole("slider", { name: "Slide" }) as HTMLInputElement;
    range.value = "70";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await user.selectOptions(inForm.getByRole("combobox", { name: "Fruit" }), "apple");
    await user.click(
      within(inForm.getByRole("radiogroup", { name: "Group" })).getByRole("radio", { name: "b" }),
    );
    await user.click(inForm.getByRole("checkbox", { name: "b" }));
    await user.click(
      within(inForm.getByRole("radiogroup", { name: "Segment" })).getByRole("radio", { name: "b" }),
    );
    await user.click(inForm.getByRole("radio", { name: "4 stars" }));
    await user.click(inForm.getByRole("radio", { name: "Lone Y" }));

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

describe("form reset under a normalizing echo", () => {
  it("a parent that sorts the reported selection is still giving it back", async () => {
    const user = userEvent.setup();
    render(EchoFixture);
    const form = screen.getByTestId("sorted-echo-form") as HTMLFormElement;
    const boxes = () => new FormData(form).getAll("sorted").join(",");
    expect(boxes()).toBe("b");

    // The machine stores toggle order, the parent stores sorted order: the
    // same selection, written differently, and still not new intent. (The
    // payload follows DOM order either way, which is why the order the two
    // sides disagree on is invisible here and matters only to the compare.)
    await user.click(within(form).getByRole("checkbox", { name: "a" }));
    expect(boxes()).toBe("a,b");

    form.reset();
    await settled();
    expect(boxes(), "a re-ordered echo must not become the new default").toBe("b");
  });
});

describe("form reset when the consumer narrows the selection", () => {
  it("a prop that is a smaller selection is a new default, not an echo", async () => {
    const user = userEvent.setup();
    const { rerender } = render(CheckboxGroup, {
      props: {
        label: "Boxes",
        name: "boxes",
        value: ["a", "b"],
        items: [{ value: "a" }, { value: "b" }],
      },
    });
    const form = document.createElement("form");
    const root = document.querySelector(".checkbox-group")!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);
    const boxes = () => new FormData(form).getAll("boxes").join(",");
    expect(boxes()).toBe("a,b");

    // The consumer drops one: fewer values than the control holds, which is
    // their decision. An echo can only ever be the same selection.
    await rerender({
      label: "Boxes",
      name: "boxes",
      value: ["a"],
      items: [{ value: "a" }, { value: "b" }],
    });
    expect(boxes()).toBe("a");

    await user.click(within(form).getByRole("checkbox", { name: "b" }));
    expect(boxes()).toBe("a,b");
    form.reset();
    await settled();
    expect(boxes(), "the narrowed selection is the default now").toBe("a");
  });
});

describe("form reset clears what the control was showing", () => {
  it("a MultiSelect comes back unfiltered, not still narrowed by a query", async () => {
    const user = userEvent.setup();
    const rendered = render(MultiSelect, {
      props: {
        label: "Skills",
        name: "skills",
        values: ["svelte"],
        items: [
          { value: "svelte", label: "Svelte" },
          { value: "vue", label: "Vue" },
          { value: "react", label: "React" },
        ],
      },
    });
    const form = document.createElement("form");
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);

    const input = screen.getByRole("combobox", { name: "Skills" });
    await user.click(input);
    await user.type(input, "re");
    expect(screen.getAllByRole("option")).toHaveLength(1);

    form.reset();
    await settled();
    await user.click(input);
    // The query went with the native restore; the list it filtered has to
    // come back with it.
    expect(screen.getAllByRole("option").length, "the filter outlived the reset").toBeGreaterThan(
      1,
    );
  });
});

describe("form reset without a name", () => {
  it("a nameless control still comes back, as every native one does", async () => {
    const user = userEvent.setup();
    const rendered = render(TimeField, { props: { label: "Time", value: "09:30" } });
    const form = document.createElement("form");
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);

    const hour = screen.getAllByRole("spinbutton")[0];
    hour.focus();
    await user.keyboard("{ArrowUp}");
    expect(hour.textContent?.trim()).toBe("10");

    form.reset();
    await settled();
    expect(hour.textContent?.trim(), "no name is not no reset").toBe("09");
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

// A reset that put the page back but left the control's own copy of the value
// at the edit would be invisible until the next prop change: the control would
// read that change as a give-back of what it thinks it holds, and keep the old
// default. These are the controls whose visible state native restores on its
// own, so this is the only place their restore is observable.
describe.each([
  {
    name: "TextField",
    component: TextField,
    props: { label: "F", name: "f", value: "Ada" },
    edit: async (user: ReturnType<typeof userEvent.setup>, text: string) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, text);
    },
    typed: "Grace",
    other: "Hopper",
    adopt: (value: string) => ({ label: "F", name: "f", value }),
  },
  {
    name: "Textarea",
    component: Textarea,
    props: { label: "F", name: "f", value: "Ada" },
    edit: async (user: ReturnType<typeof userEvent.setup>, text: string) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, text);
    },
    typed: "Grace",
    other: "Hopper",
    adopt: (value: string) => ({ label: "F", name: "f", value }),
  },
  {
    name: "Select",
    component: Select,
    props: { label: "F", name: "f", value: "pear", items: fruit },
    edit: async (user: ReturnType<typeof userEvent.setup>, text: string) =>
      user.selectOptions(screen.getByRole("combobox", { name: "F" }), text),
    typed: "apple",
    other: "pear",
    adopt: (value: string) => ({ label: "F", name: "f", value, items: fruit }),
  },
])("$name after a reset", (entry) => {
  it("judges the next prop change against what the page now shows", async () => {
    const user = userEvent.setup();
    const rendered = render(entry.component as never, { props: entry.props as never });
    const form = document.createElement("form");
    const root = rendered.container.firstElementChild!;
    root.parentElement!.insertBefore(form, root);
    form.append(root);

    await entry.edit(user, entry.typed);
    form.reset();
    await settled();

    // The consumer now chooses the very value the user had typed. That is a
    // new default, and it reads as one only if the reset put the control's
    // own copy back as well as the page.
    await rendered.rerender(entry.adopt(entry.typed) as never);
    await entry.edit(user, entry.other);
    form.reset();
    await settled();
    expect(new FormData(form).get("f")).toBe(entry.typed);
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

  it("a control moved into another form follows its new owner", async () => {
    const user = userEvent.setup();
    const { form } = mount();
    const other = document.createElement("form");
    document.body.append(other);
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");

    // The move: the control now belongs to the second form.
    other.append(form.firstElementChild!);
    form.reset();
    await settled();
    expect(input, "the old owner must not reach it").toHaveValue("Grace");

    other.reset();
    await settled();
    expect(input, "the new owner must").toHaveValue("Ada");
    other.remove();
  });

  it("one cancelled reset does not call off another that was not", async () => {
    const user = userEvent.setup();
    const renderedField = mount();
    const { form } = renderedField;
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");

    // Two resets in the same task, the second cancelled. The first was not,
    // and the page it restored must not be left disagreeing with the machine.
    form.reset();
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await settled();
    expect(input).toHaveValue("Ada");
    expect(new FormData(form).get("name")).toBe("Ada");

    // And the machine agrees with the page, which only the owed restore can
    // have done: the consumer adopting the old edit is then a new default,
    // not an echo of what the control still thinks it holds.
    const { rerender } = renderedField;
    await rerender({ label: "Name", name: "name", value: "Grace" });
    await user.clear(input);
    await user.type(input, "Hopper");
    form.reset();
    await settled();
    expect(input).toHaveValue("Grace");
  });

  it("a control that has left the page hears nothing", async () => {
    const { form, unmount } = mount();
    unmount();
    expect(() => form.reset()).not.toThrow();
    await settled();
  });
});
