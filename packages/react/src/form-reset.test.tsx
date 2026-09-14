import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox/Checkbox";
import { Switch } from "./switch/Switch";

/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

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

    form.reset();
    await settled();
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
    form.reset();
    await settled();

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

    form.reset();
    await settled();
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

    form.reset();
    await settled();
    expect(payload(form)).toBe("on");
  });
});
