import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, h, type PropType } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { DatePicker } from "./date-picker/DatePicker";
import { MultiSelect } from "./multi-select/MultiSelect";
import { NumberField } from "./number-field/NumberField";
import { Select } from "./select/Select";
import { TextField } from "./text-field/TextField";
import { TimeField } from "./time-field/TimeField";

// Composition contract B: one native form composing native controls and every
// hidden-input family. The unit of assertion is the whole FormData payload,
// name AND order, not any single control.

const countries = [
  { value: "it", label: "Italy" },
  { value: "fr", label: "France" },
];
const fruits = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];
const skills = [
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
  { value: "react", label: "React" },
];

const Fixture = defineComponent({
  props: {
    nameError: { type: String, default: undefined },
    amountError: { type: String, default: undefined },
    timeError: { type: String, default: undefined },
    second: { type: Boolean, default: false },
    onNameChange: { type: Function as PropType<(v: string) => void>, default: undefined },
    onAmountChange: {
      type: Function as PropType<(v: number | null) => void>,
      default: undefined,
    },
    onAmountCommit: {
      type: Function as PropType<(v: number | null) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () => [
      h("form", { "data-testid": "composed-form" }, [
        h(TextField, {
          label: "Name",
          name: "name",
          value: "Ada",
          error: props.nameError,
          onValueChange: props.onNameChange,
        }),
        h(Checkbox, { label: "Subscribe", name: "subscribe", value: "yes", checked: true }),
        h(Select, { label: "Country", name: "country", value: "it", items: countries }),
        h(Combobox, { label: "Fruit", name: "fruit", value: "pear", items: fruits }),
        h(MultiSelect, {
          label: "Skills",
          name: "skills",
          values: ["svelte", "vue"],
          items: skills,
        }),
        h(NumberField, {
          label: "Amount",
          name: "amount",
          value: 1234.5,
          locale: "it-IT",
          step: 0.5,
          error: props.amountError,
          onValueChange: props.onAmountChange,
          onValueCommit: props.onAmountCommit,
        }),
        h(TimeField, { label: "Time", name: "time", value: "09:30", error: props.timeError }),
        h(DatePicker, { label: "Due date", name: "due", value: "2026-06-15" }),
        h("button", { type: "reset" }, "Reset"),
      ]),
      props.second
        ? h("form", { "data-testid": "second-form" }, [
            h(TextField, { label: "Name", name: "name", value: "Grace" }),
            h(NumberField, { label: "Amount", name: "amount", value: 2, locale: "it-IT" }),
            h(MultiSelect, { label: "Skills", name: "skills", values: ["react"], items: skills }),
          ])
        : null,
    ];
  },
});

const entries = (form: HTMLFormElement) => [...new FormData(form).entries()];

describe("Vue form composition", () => {
  it("serializes exactly the accepted values in source order", () => {
    render(Fixture);
    const form = screen.getByTestId("composed-form") as HTMLFormElement;
    expect(entries(form)).toEqual([
      ["name", "Ada"],
      ["subscribe", "yes"],
      ["country", "it"],
      ["fruit", "pear"],
      ["skills", "svelte"],
      ["skills", "vue"],
      ["amount", "1234.5"],
      ["time", "09:30"],
      ["due", "2026-06-15"],
    ]);
  });

  it("keeps focus and drafts when application errors are inserted mid-edit", async () => {
    const { rerender } = render(Fixture);
    const name = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    const amount = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
    amount.focus();
    await fireEvent.update(amount, "7,");
    await rerender({
      nameError: "Name is taken",
      amountError: "Amount is wrong",
      timeError: "Too early",
    });
    expect(document.activeElement).toBe(amount);
    expect(amount.value).toBe("7,");
    expect(name.value).toBe("Ada");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Name is taken")).toBeVisible();
    expect(screen.getByText("Too early")).toBeVisible();
  });

  it("does not double-notify on reflection or reset", async () => {
    const onNameChange = vi.fn();
    const onAmountChange = vi.fn();
    const onAmountCommit = vi.fn();
    const { rerender } = render(Fixture, {
      props: { onNameChange, onAmountChange, onAmountCommit },
    });
    const amount = screen.getByRole("spinbutton", { name: "Amount" }) as HTMLInputElement;
    await fireEvent.update(amount, "7");
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    await rerender({ onNameChange, onAmountChange, onAmountCommit });
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    const form = screen.getByTestId("composed-form") as HTMLFormElement;
    form.reset();
    await Promise.resolve();
    expect(onAmountChange).toHaveBeenCalledTimes(1);
    expect(onAmountCommit).not.toHaveBeenCalled();
    expect(onNameChange).not.toHaveBeenCalled();
    expect(new FormData(form).get("amount")).toBe("1234.5");
  });

  it("keeps two composed instances apart: unique ids, independent payloads", () => {
    render(Fixture, { props: { second: true } });
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    const first = screen.getByTestId("composed-form") as HTMLFormElement;
    const second = screen.getByTestId("second-form") as HTMLFormElement;
    expect(new FormData(first).get("name")).toBe("Ada");
    expect(new FormData(second).get("name")).toBe("Grace");
    expect(new FormData(second).getAll("skills")).toEqual(["react"]);
  });

  it("has no axe violations with errors shown", async () => {
    const { container } = render(Fixture, {
      props: { nameError: "Name is taken", amountError: "Amount is wrong" },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
