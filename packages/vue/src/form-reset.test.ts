import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, reactive, ref } from "vue";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { DatePicker } from "./date-picker/DatePicker";
import { DateRangePicker } from "./date-range-picker/DateRangePicker";
import { MultiSelect } from "./multi-select/MultiSelect";
import { RadioGroup as RadioGroupControl } from "./radio-group/RadioGroup";
import { NumberField } from "./number-field/NumberField";
import { PinInput } from "./pin-input/PinInput";
import { TimeField } from "./time-field/TimeField";
import { CheckboxGroup } from "./checkbox-group/CheckboxGroup";
import { RadioGroup } from "./radio-group/RadioGroup";
import { RatingGroup } from "./rating-group/RatingGroup";
import { SegmentedControl } from "./segmented-control/SegmentedControl";
import { Select } from "./select/Select";
import { Slider } from "./slider/Slider";
import { Switch } from "./switch/Switch";
import { TextField } from "./text-field/TextField";
import { Textarea } from "./textarea/Textarea";
import { ToggleButton } from "./toggle-button/ToggleButton";

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Render a control inside a real form. The props stay live, so a test can
 * move one and make the component render again.
 */
const inForm = (component: unknown, props: Record<string, unknown>) => {
  const live = reactive({ ...props });
  const rendered = render(
    defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [h(component as never, live as never)]),
    }),
  );
  return { ...rendered, live, form: screen.getByTestId("host") as HTMLFormElement };
};

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];
const ab = [{ value: "a" }, { value: "b" }];

interface Row {
  name: string;
  component: unknown;
  props: Record<string, unknown>;
  /** The DOM default the control must carry, before and after the edit. */
  wants: string;
  domDefault: () => string;
  edit: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  edited: string | null;
  restored: string | null;
  payload?: (form: HTMLFormElement) => string | null;
  /** Adopt the edited value as the consumer's own choice, and what that
   *  makes the DOM default. */
  adopt: (live: Record<string, unknown>) => void;
  adopted: string;
}

// One row per control: the default is in the DOM and does not follow the
// edit, the payload comes back, and nothing is reported.
const CONTROLS: Row[] = [
  {
    name: "TextField",
    adopt: (live) => (live.modelValue = "Grace"),
    adopted: "Grace",
    component: TextField,
    props: { label: "F", name: "f", modelValue: "Ada" },
    wants: "Ada",
    domDefault: () => screen.getByRole("textbox", { name: "F" }).getAttribute("value") ?? "",
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
  },
  {
    name: "Textarea",
    adopt: (live) => (live.modelValue = "Grace"),
    adopted: "Grace",
    component: Textarea,
    props: { label: "F", name: "f", modelValue: "Ada" },
    wants: "Ada",
    domDefault: () =>
      (screen.getByRole("textbox", { name: "F" }) as HTMLTextAreaElement).defaultValue,
    edit: async (user) => {
      const input = screen.getByRole("textbox", { name: "F" });
      await user.clear(input);
      await user.type(input, "Grace");
    },
    edited: "Grace",
    restored: "Ada",
  },
  {
    name: "Checkbox",
    adopt: (live) => (live.modelValue = true),
    adopted: "true",
    component: Checkbox,
    props: { label: "F", name: "f", modelValue: false },
    wants: "false",
    domDefault: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).defaultChecked),
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
  },
  {
    name: "Switch",
    adopt: (live) => (live.modelValue = false),
    adopted: "false",
    component: Switch,
    props: { label: "F", name: "f", modelValue: true },
    wants: "true",
    domDefault: () =>
      String((screen.getByRole("switch", { name: "F" }) as HTMLInputElement).defaultChecked),
    edit: async (user) => user.click(screen.getByRole("switch", { name: "F" })),
    edited: null,
    restored: "on",
  },
  {
    name: "ToggleButton",
    adopt: (live) => (live.modelValue = true),
    adopted: "true",
    component: ToggleButton,
    props: { label: "F", name: "f", modelValue: false },
    wants: "false",
    domDefault: () =>
      String((screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).defaultChecked),
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    edited: "on",
    restored: null,
  },
  {
    name: "Slider",
    adopt: (live) => (live.modelValue = 70),
    adopted: "70",
    component: Slider,
    props: { label: "F", name: "f", modelValue: 30, min: 0, max: 100 },
    wants: "30",
    domDefault: () => screen.getByRole("slider", { name: "F" }).getAttribute("value") ?? "",
    edit: async () => {
      const input = screen.getByRole("slider", { name: "F" }) as HTMLInputElement;
      input.value = "70";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await settled();
    },
    edited: "70",
    restored: "30",
  },
  {
    name: "Select",
    adopt: (live) => (live.modelValue = "apple"),
    adopted: "apple",
    component: Select,
    // The default is the second option: were the selected attribute missing,
    // a native reset would land on the first.
    props: { label: "F", name: "f", modelValue: "pear", items: fruit },
    wants: "pear",
    domDefault: () =>
      [...(screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement).options]
        .filter((option) => option.defaultSelected)
        .map((option) => option.value)
        .join(","),
    edit: async (user) => user.selectOptions(screen.getByRole("combobox", { name: "F" }), "apple"),
    edited: "apple",
    restored: "pear",
  },
  {
    name: "RadioGroup",
    adopt: (live) => (live.modelValue = "b"),
    adopted: "b",
    component: RadioGroup,
    props: { label: "F", name: "f", modelValue: "a", items: ab },
    wants: "a",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    edit: async (user) => user.click(screen.getByRole("radio", { name: "b" })),
    edited: "b",
    restored: "a",
  },
  {
    name: "SegmentedControl",
    adopt: (live) => (live.modelValue = "b"),
    adopted: "b",
    component: SegmentedControl,
    props: { label: "F", name: "f", modelValue: "a", items: ab },
    wants: "a",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    edit: async (user) => user.click(screen.getByRole("radio", { name: "b" })),
    edited: "b",
    restored: "a",
  },
  {
    name: "CheckboxGroup",
    adopt: (live) => (live.modelValue = ["a", "b"]),
    adopted: "a,b",
    component: CheckboxGroup,
    props: { label: "F", name: "f", modelValue: ["a"], items: ab },
    wants: "a",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=checkbox]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    edit: async (user) => user.click(screen.getByRole("checkbox", { name: "b" })),
    edited: "a,b",
    restored: "a",
    payload: (form) => {
      const all = new FormData(form).getAll("f");
      return all.length ? all.join(",") : null;
    },
  },
  {
    name: "RatingGroup",
    adopt: (live) => (live.modelValue = 4),
    adopted: "4",
    component: RatingGroup,
    props: { label: "F", name: "f", modelValue: 2, max: 5 },
    wants: "2",
    domDefault: () =>
      [...document.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((input) => input.defaultChecked)
        .map((input) => input.value)
        .join(","),
    edit: async (user) => user.click(screen.getByRole("radio", { name: "4 stars" })),
    edited: "4",
    restored: "2",
  },
];

describe.each(CONTROLS)("Vue form reset restores $name", (entry) => {
  it("puts the payload back, and reports nothing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onCheckedChange = vi.fn();
    const onPressedChange = vi.fn();
    // A v-model parent, which is the idiomatic Vue binding and the one that
    // makes the give-back rule observable: the prop moves with every report,
    // so a control that took each prop change for a new default would restore
    // the edit instead of undoing it.
    const { form, live } = inForm(entry.component, {
      ...entry.props,
      "onUpdate:modelValue": (next: unknown) => (live.modelValue = next),
      onValueChange,
      onCheckedChange,
      onPressedChange,
    });
    const payload =
      entry.payload ?? ((host: HTMLFormElement) => new FormData(host).get("f") as string | null);

    expect(entry.domDefault(), "the DOM default must be there from the start").toBe(entry.wants);
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
    const after =
      onValueChange.mock.calls.length +
      onCheckedChange.mock.calls.length +
      onPressedChange.mock.calls.length;
    expect(after, "a reset is not a user change").toBe(reported);

    // A render caused by something else must not put the page back to the
    // default: the attribute is patched by every render, and the property
    // has to be written again after it.
    await entry.edit(user);
    live.label = "F ";
    await settled();
    expect(payload(form), "an unrelated render undid the edit").toBe(entry.edited);
    live.label = "F";
    await settled();

    form.reset();
    await settled();

    // The consumer now chooses the very value the user had. That reads as a
    // new default only if the reset put the control's own state back: a
    // control that still thought it held that value would call it an echo.
    entry.adopt(live);
    await settled();
    expect(entry.domDefault(), "the adopted value did not become the default").toBe(entry.adopted);
  });
});

// The composite families submit through hidden inputs, which a native reset
// never touches: their payload comes back only because the control was told.
// The number field is here too, in its own suite: it is the one that already
// had a reset, and the whole scenario lives beside the rest of its behaviour.
// ADR 0012: the restore puts the control's own copy of the value back. In Vue
// that copy is the v-model binding, so a v-model consumer ends a reset
// agreeing with the page. The change callback still does not fire.
// The same rule asked of the families whose payload lives in a hidden input:
// a report echoed back into the prop is not a new default. Each one is driven
// through a v-model parent, the way a Vue consumer writes it.
describe.each([
  {
    name: "Combobox",
    component: Combobox,
    props: { label: "F", name: "f", items: fruit },
    mounted: "pear",
    edit: async (user: ReturnType<typeof userEvent.setup>) => {
      const input = screen.getByRole("combobox", { name: "F" });
      await user.clear(input);
      await user.type(input, "App");
      await user.click(screen.getByRole("option", { name: /Apple/ }));
    },
    edited: "apple",
    read: (form: HTMLFormElement) => new FormData(form).get("f") as string | null,
  },
  {
    name: "PinInput",
    component: PinInput,
    props: { label: "F", name: "f", length: 4 },
    mounted: "1234",
    edit: async (user: ReturnType<typeof userEvent.setup>) => {
      const cells = screen.getAllByRole("textbox");
      await user.click(cells[0]!);
      await user.keyboard("{Backspace}");
    },
    edited: "234",
    read: (form: HTMLFormElement) => new FormData(form).get("f") as string | null,
  },
  {
    name: "TimeField",
    component: TimeField,
    props: { label: "F", name: "f" },
    mounted: "09:30",
    edit: async (user: ReturnType<typeof userEvent.setup>) => {
      const hour = screen.getAllByRole("spinbutton")[0]!;
      hour.focus();
      await user.keyboard("{ArrowUp}");
    },
    edited: "10:30",
    read: (form: HTMLFormElement) => new FormData(form).get("f") as string | null,
  },
  {
    name: "NumberField",
    component: NumberField,
    props: { label: "F", name: "f" },
    mounted: 10,
    edit: async () => {
      const field = screen.getByRole("spinbutton", { name: "F" }) as HTMLInputElement;
      field.value = "77";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await settled();
    },
    edited: "77",
    read: (form: HTMLFormElement) => new FormData(form).get("f") as string | null,
  },
])("Vue form reset, $name under a v-model parent", (entry) => {
  it("an echoed report is not a new default", async () => {
    const user = userEvent.setup();
    const { form, live } = inForm(entry.component, {
      ...entry.props,
      modelValue: entry.mounted,
      "onUpdate:modelValue": (next: unknown) => (live.modelValue = next),
    });
    expect(entry.read(form)).toBe(String(entry.mounted));

    await entry.edit(user);
    expect(entry.read(form)).toBe(entry.edited);
    expect(live.modelValue, "the parent took the report").not.toBe(entry.mounted);

    form.reset();
    await settled();
    expect(entry.read(form), "an echo must not have become the default").toBe(
      String(entry.mounted),
    );
    expect(live.modelValue, "and the binding came back with it").toBe(entry.mounted);
  });
});

describe("Vue form reset and v-model", () => {
  it("puts a v-model ref back, without reporting a change", async () => {
    const user = userEvent.setup();
    const bound = ref("Ada");
    const onValueChange = vi.fn();
    const Host = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [
          h(TextField, {
            label: "Name",
            name: "name",
            modelValue: bound.value,
            "onUpdate:modelValue": (next: string) => (bound.value = next),
            onValueChange,
          }),
        ]),
    });
    render(Host);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = screen.getByRole("textbox", { name: "Name" });

    await user.clear(input);
    await user.type(input, "Grace");
    expect(bound.value).toBe("Grace");
    const reported = onValueChange.mock.calls.length;

    form.reset();
    await settled();
    expect(input).toHaveValue("Ada");
    expect(new FormData(form).get("name")).toBe("Ada");
    expect(bound.value, "the binding came back with the page").toBe("Ada");
    expect(onValueChange, "a reset is not a user change").toHaveBeenCalledTimes(reported);
  });

  it("puts a v-model checkbox back too", async () => {
    const user = userEvent.setup();
    const bound = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "host" }, [
          h(Checkbox, {
            label: "Agree",
            name: "agree",
            modelValue: bound.value,
            "onUpdate:modelValue": (next: boolean) => (bound.value = next),
          }),
        ]),
    });
    render(Host);
    const form = screen.getByTestId("host") as HTMLFormElement;
    await user.click(screen.getByRole("checkbox", { name: "Agree" }));
    expect(bound.value).toBe(true);

    form.reset();
    await settled();
    expect(bound.value, "the binding came back with the page").toBe(false);
    expect(new FormData(form).has("agree")).toBe(false);
  });
});

describe("Vue form reset, the composite families", () => {
  const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

  it("Combobox comes back to its text and its closed list, not only its value", async () => {
    const user = userEvent.setup();
    const { form } = inForm(Combobox, {
      label: "Fruit",
      name: "fruit",
      value: "pear",
      items: fruit,
    });
    const input = screen.getByRole("combobox", { name: "Fruit" });

    // Typed but never selected: the value never changed, so a restore that
    // goes through the value watch has nothing to do and leaves this text.
    await user.clear(input);
    await user.type(input, "App");
    expect(input).toHaveValue("App");
    expect(screen.getByRole("listbox")).toHaveAttribute("data-state", "open");

    form.reset();
    await settled();
    expect(input, "the text the user typed is gone").toHaveValue("Pear");
    expect(screen.getByRole("listbox"), "and the list is closed").toHaveAttribute(
      "data-state",
      "closed",
    );
    expect(new FormData(form).get("fruit")).toBe("pear");
  });

  it("Combobox comes back to its value and its text", async () => {
    const user = userEvent.setup();
    const { form } = inForm(Combobox, {
      label: "Fruit",
      name: "fruit",
      value: "pear",
      items: fruit,
    });
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.clear(input);
    await user.type(input, "App");
    await user.click(screen.getByRole("option", { name: /Apple/ }));
    expect(new FormData(form).get("fruit")).toBe("apple");

    form.reset();
    await settled();
    expect(new FormData(form).get("fruit")).toBe("pear");
    expect(input).toHaveValue("Pear");
  });

  it("MultiSelect: an echoed selection is not a new default", async () => {
    const user = userEvent.setup();
    const values = ["vue"];
    const { form, live } = inForm(MultiSelect, {
      label: "Skills",
      name: "skills",
      values,
      items: [
        { value: "vue", label: "Vue" },
        { value: "react", label: "React" },
      ],
      onValuesChange: (next: string[]) => (live.values = next),
    });
    const read = () => new FormData(form).getAll("skills").join(",");
    expect(read()).toBe("vue");

    await user.click(screen.getByRole("combobox", { name: "Skills" }));
    await user.click(screen.getByRole("option", { name: "React" }));
    expect(read()).toBe("vue,react");
    expect(live.values, "the parent took the report").toEqual(["vue", "react"]);

    form.reset();
    await settled();
    expect(read(), "an echo must not have become the default").toBe("vue");
  });

  it("DateRangePicker: an echoed range is not a new default", async () => {
    const user = userEvent.setup();
    const { form, live } = inForm(DateRangePicker, {
      label: "Window",
      startName: "from",
      endName: "to",
      start: "2026-06-01",
      end: "2026-06-10",
      onChange: (start: string | null, end: string | null) => {
        live.start = start;
        live.end = end;
      },
    });
    await user.click(screen.getByRole("combobox", { name: "Window" }));
    await user.click(day("2026-06-15"));
    await user.click(day("2026-06-20"));
    expect(live.start, "the parent took the report").toBe("2026-06-15");

    form.reset();
    await settled();
    const restored = new FormData(form);
    expect(restored.get("from"), "an echo must not have become the default").toBe("2026-06-01");
    expect(restored.get("to")).toBe("2026-06-10");
  });

  it("MultiSelect comes back to its selection, unfiltered", async () => {
    const user = userEvent.setup();
    const { form } = inForm(MultiSelect, {
      label: "Skills",
      name: "skills",
      values: ["vue"],
      items: [
        { value: "vue", label: "Vue" },
        { value: "react", label: "React" },
      ],
    });
    const input = screen.getByRole("combobox", { name: "Skills" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "React" }));
    expect(new FormData(form).getAll("skills").join(",")).toBe("vue,react");

    await user.type(input, "re");
    form.reset();
    await settled();
    expect(new FormData(form).getAll("skills").join(",")).toBe("vue");
    expect(screen.getByRole("listbox"), "the list closed with the reset").toHaveAttribute(
      "data-state",
      "closed",
    );
    await user.click(input);
    expect(screen.getAllByRole("option").length, "the filter outlived the reset").toBe(2);
  });

  it("MultiSelect: a consumer clearing the selection sets a new default", async () => {
    const user = userEvent.setup();
    const { form, live } = inForm(MultiSelect, {
      label: "Skills",
      name: "skills",
      values: ["vue"],
      items: [
        { value: "vue", label: "Vue" },
        { value: "react", label: "React" },
      ],
    });
    expect(new FormData(form).getAll("skills").join(",")).toBe("vue");

    // An empty selection is a selection: this is the consumer's decision,
    // not the control giving back what it reported.
    live.values = [];
    await settled();
    expect(new FormData(form).getAll("skills").join(",")).toBe("");

    await user.click(screen.getByRole("combobox", { name: "Skills" }));
    await user.click(screen.getByRole("option", { name: "React" }));
    expect(new FormData(form).getAll("skills").join(",")).toBe("react");

    form.reset();
    await settled();
    expect(new FormData(form).getAll("skills").join(","), "back to empty").toBe("");
  });

  it("PinInput comes back to the split default", async () => {
    const user = userEvent.setup();
    const { form } = inForm(PinInput, { label: "Code", name: "pin", length: 4, value: "1234" });
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.keyboard("{Backspace}9");
    expect(new FormData(form).get("pin")).not.toBe("1234");

    form.reset();
    await settled();
    expect(new FormData(form).get("pin")).toBe("1234");
    expect(cells[0]).toHaveValue("1");
  });

  it("TimeField: an Escape after a reset settles on what the reset put back", async () => {
    const user = userEvent.setup();
    const { form } = inForm(TimeField, { label: "Time", name: "time", value: "09:30" });
    const hour = screen.getAllByRole("spinbutton")[0]!;
    hour.focus();
    await user.keyboard("{ArrowUp}");
    // Focus leaves the field, not just the segment: that is what commits, and
    // a commit is what makes the edit the thing an Escape would settle on.
    const outside = document.createElement("button");
    document.body.append(outside);
    await user.click(outside);
    expect(new FormData(form).get("time")).toBe("10:30");

    form.reset();
    await settled();
    expect(new FormData(form).get("time")).toBe("09:30");

    // Escape reverts to the committed time. A reset that left the committed
    // parts behind would put the pre-reset edit back here.
    hour.focus();
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Escape}");
    expect(new FormData(form).get("time"), "the reset is what Escape settles on").toBe("09:30");
    outside.remove();
  });

  it("TimeField comes back across its segments", async () => {
    const user = userEvent.setup();
    const { form } = inForm(TimeField, { label: "Time", name: "time", value: "09:30" });
    const hour = screen.getAllByRole("spinbutton")[0]!;
    hour.focus();
    await user.keyboard("{ArrowUp}");
    expect(new FormData(form).get("time")).toBe("10:30");

    form.reset();
    await settled();
    expect(new FormData(form).get("time")).toBe("09:30");
    expect(hour.textContent?.trim()).toBe("09");
  });

  it("DatePicker comes back to its date", async () => {
    const user = userEvent.setup();
    const { form } = inForm(DatePicker, { label: "Due", name: "due", value: "2026-06-15" });
    await user.click(screen.getByRole("combobox", { name: "Due" }));
    await user.click(day("2026-06-20"));
    expect(new FormData(form).get("due")).toBe("2026-06-20");

    form.reset();
    await settled();
    expect(new FormData(form).get("due")).toBe("2026-06-15");
  });

  it("DateRangePicker brings both ends back", async () => {
    const user = userEvent.setup();
    const { form } = inForm(DateRangePicker, {
      label: "Window",
      startName: "from",
      endName: "to",
      start: "2026-06-01",
      end: "2026-06-10",
    });
    await user.click(screen.getByRole("combobox", { name: "Window" }));
    await user.click(day("2026-06-15"));
    await user.click(day("2026-06-20"));
    expect(new FormData(form).get("from")).toBe("2026-06-15");

    form.reset();
    await settled();
    const restored = new FormData(form);
    expect(restored.get("from")).toBe("2026-06-01");
    expect(restored.get("to")).toBe("2026-06-10");
  });
});

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

  it("a control moved into another form follows its new owner", async () => {
    const user = userEvent.setup();
    const { form } = inForm(TextField, { label: "Name", name: "name", value: "Ada" });
    const other = document.createElement("form");
    document.body.append(other);
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");

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
    const { form, live } = inForm(TextField, { label: "Name", name: "name", value: "Ada" });
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");

    form.reset();
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    form.reset();
    await settled();
    expect(input).toHaveValue("Ada");

    // And the state agrees with the page, which only the owed restore can
    // have done: adopting the old edit is then a new default.
    live.value = "Grace";
    await settled();
    expect(input.getAttribute("value")).toBe("Grace");
  });

  it("a group moved into another form follows its new owner", async () => {
    const user = userEvent.setup();
    const { form } = inForm(RadioGroupControl, {
      label: "Group",
      name: "group",
      value: "a",
      items: [{ value: "a" }, { value: "b" }],
    });
    const other = document.createElement("form");
    document.body.append(other);
    await user.click(screen.getByRole("radio", { name: "b" }));
    expect(new FormData(form).get("group")).toBe("b");

    // A group anchors on its own wrapper, not on an input, so the owner can
    // only be right if it is resolved when the reset arrives.
    other.append(form.firstElementChild!);
    form.reset();
    await settled();
    expect(new FormData(other).get("group"), "the old owner must not reach it").toBe("b");

    other.reset();
    await settled();
    expect(new FormData(other).get("group"), "the new owner must").toBe("a");
    other.remove();
  });

  it("a control that has left the page hears nothing", async () => {
    const user = userEvent.setup();
    const bound = vi.fn();
    // The form outlives the control: unmounting a control together with its
    // form would detach the form, and a reset on a detached form reaches no
    // listener anyway.
    const form = document.createElement("form");
    document.body.append(form);
    const host = document.createElement("div");
    form.append(host);
    const rendered = render(TextField as never, {
      container: host,
      props: { label: "Name", name: "name", modelValue: "Ada", "onUpdate:modelValue": bound },
    });
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "Grace");
    bound.mockClear();

    rendered.unmount();
    expect(() => form.reset()).not.toThrow();
    await settled();
    expect(bound, "a control that has gone must report nothing").not.toHaveBeenCalled();
    form.remove();
  });

  it("and takes its listener with it", async () => {
    // The listener sits on the document, so one left behind outlives every
    // control the page ever had.
    const added: unknown[] = [];
    const realAdd = document.addEventListener.bind(document);
    const realRemove = document.removeEventListener.bind(document);
    document.addEventListener = ((type: string, listener: unknown, options?: unknown) => {
      if (type === "reset") added.push(listener);
      return realAdd(type as keyof DocumentEventMap, listener as EventListener, options as never);
    }) as typeof document.addEventListener;
    document.removeEventListener = ((type: string, listener: unknown, options?: unknown) => {
      if (type === "reset") {
        const at = added.indexOf(listener);
        if (at !== -1) added.splice(at, 1);
      }
      return realRemove(
        type as keyof DocumentEventMap,
        listener as EventListener,
        options as never,
      );
    }) as typeof document.removeEventListener;

    try {
      const { unmount } = inForm(TextField, { label: "Name", name: "name", modelValue: "Ada" });
      expect(added.length, "the control listens while it is here").toBe(1);
      unmount();
      expect(added.length, "and stops when it goes").toBe(0);
    } finally {
      document.addEventListener = realAdd as typeof document.addEventListener;
      document.removeEventListener = realRemove as typeof document.removeEventListener;
    }
  });
});
