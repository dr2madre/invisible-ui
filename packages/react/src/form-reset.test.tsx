import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox/Checkbox";
import { Combobox } from "./combobox/Combobox";
import { MultiSelect } from "./multi-select/MultiSelect";
import { Select } from "./select/Select";
import { Switch } from "./switch/Switch";

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];

/**
 * Reset the form and wait past the restore, which runs one task after the
 * event. The wait is inside `act` because the restore sets state from a timer,
 * outside anything React is already tracking, and the render it causes has to
 * land before the assertions read the DOM.
 */
const resetAndSettle = (form: HTMLFormElement) =>
  act(async () => {
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const payload = (form: HTMLFormElement) => {
  const all = new FormData(form).getAll("f").map(String);
  return all.length === 0 ? null : all.join(",");
};

const defaultsOf = () =>
  [...document.querySelectorAll<HTMLInputElement>("input[type=checkbox]")]
    .filter((input) => input.defaultChecked)
    .map((input) => input.value)
    .join(",");

const Form = ({ children }: { children: ReactNode }) => (
  <form data-testid="host">
    {children}
    <button type="reset">Reset</button>
  </form>
);

interface Row {
  name: string;
  /**
   * A page holding its own copy, which is how React consumers write these:
   * the prop moves with every report, so a control that took each prop change
   * for a new default would restore the edit instead of undoing it.
   */
  render: (initial: boolean, onChange: (next: boolean) => void) => ReactNode;
  toggle: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  visible: () => boolean;
}

const CONTROLS: Row[] = [
  {
    name: "Checkbox",
    render: (checked, onChange) => (
      <Checkbox
        label="F"
        name="f"
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
      />
    ),
    toggle: (user) => user.click(screen.getByRole("checkbox", { name: "F" })),
    visible: () => (screen.getByRole("checkbox", { name: "F" }) as HTMLInputElement).checked,
  },
  {
    name: "Switch",
    render: (checked, onChange) => (
      <Switch label="F" name="f" checked={checked} onCheckedChange={onChange} />
    ),
    toggle: (user) => user.click(screen.getByRole("switch", { name: "F" })),
    visible: () => (screen.getByRole("switch", { name: "F" }) as HTMLInputElement).checked,
  },
];

describe.each(CONTROLS)("React form reset restores $name", (entry) => {
  /**
   * A parent that echoes every report back into the prop, as React consumers
   * do, and can be made to render again for a reason of its own.
   */
  const Page = ({ start, onChange }: { start: boolean; onChange: (next: boolean) => void }) => {
    const [checked, setChecked] = useState(start);
    const [tick, setTick] = useState(0);
    return (
      <>
        <Form>
          {entry.render(checked, (next) => {
            setChecked(next);
            onChange(next);
          })}
        </Form>
        <button type="button" onClick={() => setTick(tick + 1)}>
          Render again
        </button>
        <p data-testid="tick">{tick}</p>
      </>
    );
  };

  it("puts the payload and the page back, and reports nothing", async () => {
    const user = userEvent.setup();
    const reported = vi.fn();
    render(<Page start={true} onChange={reported} />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    expect(payload(form)).toBe("on");
    expect(defaultsOf(), "the DOM default must be there from the start").toBe("on");

    await entry.toggle(user);
    expect(payload(form)).toBe(null);
    expect(entry.visible()).toBe(false);
    expect(defaultsOf(), "the DOM default must not follow the edit").toBe("on");
    expect(reported, "the edit itself must have been reported").toHaveBeenCalledTimes(1);

    await resetAndSettle(form);
    expect(payload(form)).toBe("on");
    expect(entry.visible(), "the page must agree with the payload").toBe(true);
    expect(reported, "a reset is not a user change").toHaveBeenCalledTimes(1);

    // The control's own copy has to come back too. The browser puts the input
    // back by itself, so a control that was never told looks right and holds
    // the edit: the next render for any reason at all writes it back.
    await user.click(screen.getByRole("button", { name: "Render again" }));
    expect(payload(form), "the next render undid the reset").toBe("on");
    expect(entry.visible()).toBe(true);
    expect(reported, "rendering again is not a user change either").toHaveBeenCalledTimes(1);
  });

  it("restores nothing when the reset is cancelled", async () => {
    const user = userEvent.setup();
    render(<Page start={true} onChange={() => {}} />);
    const form = screen.getByTestId("host") as HTMLFormElement;
    form.addEventListener("reset", (event) => event.preventDefault());

    await entry.toggle(user);
    await resetAndSettle(form);

    expect(payload(form), "a cancelled reset must leave the edit alone").toBe(null);
    expect(entry.visible()).toBe(false);
  });

  it("takes a value the page chooses for itself as the new default", async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [checked, setChecked] = useState(true);
      return (
        <>
          <Form>{entry.render(checked, setChecked)}</Form>
          <button type="button" onClick={() => setChecked(false)}>
            Turn it off
          </button>
        </>
      );
    };
    render(<Controlled />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    await user.click(screen.getByRole("button", { name: "Turn it off" }));
    expect(defaultsOf(), "a value the page chose is the new default").toBe("");

    await resetAndSettle(form);
    expect(payload(form)).toBe(null);
  });

  it("does not take an echo of the user's own edit as a new default", async () => {
    const user = userEvent.setup();
    const reported = vi.fn();
    render(<Page start={true} onChange={reported} />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    // The page mirrors the report straight back into the prop. That is an
    // echo, not a choice, so the default stays where it was.
    await entry.toggle(user);
    expect(defaultsOf(), "an echo became the default").toBe("on");

    await resetAndSettle(form);
    expect(payload(form)).toBe("on");
  });
});

// The controls the table above does not fit: a select with no state of its
// own, and the two whose payload travels in hidden inputs a reset never
// touches.
describe("React form reset restores Select", () => {
  const Page = ({ onChange }: { onChange: (next: string) => void }) => {
    const [value, setValue] = useState<string | null>("pear");
    return (
      <Form>
        <Select
          label="F"
          name="f"
          items={fruit}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      </Form>
    );
  };

  const select = () => screen.getByRole("combobox", { name: "F" }) as HTMLSelectElement;
  const selectedDefault = () =>
    [...select().options]
      .filter((option) => option.defaultSelected)
      .map((option) => option.value)
      .join(",");

  it("carries the DOM default, so the browser's own reset lands on it", async () => {
    const user = userEvent.setup();
    const reported = vi.fn();
    render(<Page onChange={reported} />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    // Were the attribute missing, a reset would land on the first option.
    expect(selectedDefault(), "the DOM default must be there from the start").toBe("pear");
    expect(payload(form)).toBe("pear");

    await user.selectOptions(select(), "apple");
    expect(payload(form)).toBe("apple");
    expect(selectedDefault(), "the DOM default must not follow the edit").toBe("pear");
    expect(reported).toHaveBeenCalledTimes(1);

    await resetAndSettle(form);
    expect(payload(form)).toBe("pear");
    expect(select().value).toBe("pear");
    expect(reported, "a reset is not a user change").toHaveBeenCalledTimes(1);
  });

  it("moves the default when the page chooses a value of its own", async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [value, setValue] = useState<string | null>("pear");
      return (
        <>
          <Form>
            <Select label="F" name="f" items={fruit} value={value} onValueChange={setValue} />
          </Form>
          <button type="button" onClick={() => setValue("apple")}>
            Choose apple
          </button>
        </>
      );
    };
    render(<Controlled />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    await user.click(screen.getByRole("button", { name: "Choose apple" }));
    expect(selectedDefault()).toBe("apple");

    await resetAndSettle(form);
    expect(payload(form)).toBe("apple");
  });

  it("does not move the default when the page echoes the user's own choice", async () => {
    const user = userEvent.setup();
    render(<Page onChange={() => {}} />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    // The page mirrors the report back into the prop: an echo, not a choice.
    await user.selectOptions(select(), "apple");
    expect(selectedDefault(), "an echo became the default").toBe("pear");

    await resetAndSettle(form);
    expect(payload(form)).toBe("pear");
  });
});

describe("React form reset restores the composite families", () => {
  it("puts Combobox back to the current default", async () => {
    const user = userEvent.setup();
    const reported = vi.fn();
    const Page = () => {
      const [value, setValue] = useState<string | null>("pear");
      return (
        <Form>
          <Combobox
            label="F"
            name="f"
            items={fruit}
            value={value}
            onValueChange={(next) => {
              setValue(next);
              reported(next);
            }}
          />
        </Form>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    expect(payload(form)).toBe("pear");
    expect(input().value).toBe("Pear");

    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Apple" }));
    expect(payload(form)).toBe("apple");
    expect(reported).toHaveBeenCalledTimes(1);

    await resetAndSettle(form);
    expect(payload(form), "the hidden input is restored by the control alone").toBe("pear");
    expect(input().value, "the text must agree with the payload").toBe("Pear");
    expect(reported, "a reset is not a user change").toHaveBeenCalledTimes(1);

    // Escape abandons what is being typed and settles on the last selection.
    // After a reset that is the restored one.
    await user.click(input());
    await user.keyboard("xyz");
    await user.keyboard("{Escape}");
    expect(input().value, "Escape went back to the value the reset undid").toBe("Pear");
  });

  it("puts the Combobox text back before the restore, not after it", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [value, setValue] = useState<string | null>("pear");
      return (
        <Form>
          <Combobox label="F" name="f" items={fruit} value={value} onValueChange={setValue} />
        </Form>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Apple" }));

    // The browser's own reset runs before anything this library does. With no
    // default behind the visible box it would empty it, and the text would
    // blink back a task later when the restore arrives.
    form.reset();
    expect(input().value, "the browser had nothing to put back").toBe("Pear");
  });

  it("takes a value the page chooses for the Combobox as the new default", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [value, setValue] = useState<string | null>("pear");
      return (
        <>
          <Form>
            <Combobox label="F" name="f" items={fruit} value={value} onValueChange={setValue} />
          </Form>
          <button type="button" onClick={() => setValue("apple")}>
            Choose apple
          </button>
        </>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    await user.click(screen.getByRole("button", { name: "Choose apple" }));
    await resetAndSettle(form);
    expect(payload(form), "a value the page chose is the new default").toBe("apple");
  });

  it("takes values the page chooses for the MultiSelect as the new default", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [values, setValues] = useState<string[]>(["pear"]);
      return (
        <>
          <Form>
            <MultiSelect
              label="F"
              name="f"
              items={fruit}
              values={values}
              onValuesChange={setValues}
            />
          </Form>
          <button type="button" onClick={() => setValues(["apple"])}>
            Choose apple
          </button>
        </>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;

    await user.click(screen.getByRole("button", { name: "Choose apple" }));
    await resetAndSettle(form);
    expect(payload(form), "values the page chose are the new default").toBe("apple");
  });

  it("puts MultiSelect back to the current default", async () => {
    const user = userEvent.setup();
    const reported = vi.fn();
    const Page = () => {
      const [values, setValues] = useState<string[]>(["pear"]);
      return (
        <Form>
          <MultiSelect
            label="F"
            name="f"
            items={fruit}
            values={values}
            onValuesChange={(next) => {
              setValues(next);
              reported(next);
            }}
          />
        </Form>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    expect(payload(form)).toBe("pear");

    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Apple" }));
    expect(payload(form)).toBe("pear,apple");
    expect(reported).toHaveBeenCalledTimes(1);

    await resetAndSettle(form);
    expect(payload(form)).toBe("pear");
    expect(reported, "a reset is not a user change").toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /Remove Pear/ }),
      "the tag list must agree with the payload",
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove Apple/ })).toBeNull();
  });

  it("clears the query the multi select was typing", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [values, setValues] = useState<string[]>(["pear"]);
      return (
        <Form>
          <MultiSelect
            label="F"
            name="f"
            items={fruit}
            values={values}
            onValuesChange={setValues}
          />
        </Form>
      );
    };
    render(<Page />);
    const form = screen.getByTestId("host") as HTMLFormElement;
    const input = () => screen.getByRole("combobox", { name: "F" }) as HTMLInputElement;

    await user.click(input());
    await user.keyboard("App");
    expect(input().value).toBe("App");

    await resetAndSettle(form);
    expect(input().value, "the restore left the query in the box").toBe("");
    expect(payload(form)).toBe("pear");
  });
});
