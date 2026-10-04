import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Radio } from "./Radio";

/** Two radios a page lays out itself, sharing one name and one copy of the choice. */
const Pair = ({
  value = "free",
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => (
  <>
    <Radio name="plan" value="free" checked={value === "free"} onChange={onChange}>
      Free
    </Radio>
    <Radio name="plan" value="pro" checked={value === "pro"} onChange={onChange}>
      Pro
    </Radio>
  </>
);

const free = () => screen.getByRole<HTMLInputElement>("radio", { name: "Free" });
const pro = () => screen.getByRole<HTMLInputElement>("radio", { name: "Pro" });

describe("React Radio", () => {
  it("renders labelled radios that share a group name", () => {
    render(<Pair />);
    expect(free()).toBeChecked();
    expect(pro()).not.toBeChecked();
    expect(free()).toHaveAttribute("name", "plan");
    expect(pro()).toHaveAttribute("name", "plan");
  });

  it("reports the value when a radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pair onChange={onChange} />);
    await user.click(pro());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("is selectable by clicking its label", async () => {
    const user = userEvent.setup();
    render(<Pair />);
    await user.click(screen.getByText("Pro"));
    expect(pro()).toBeChecked();
  });

  it("moves the choice with the arrow keys, taking one tab stop", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Pair onChange={onChange} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(free()).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith("pro");
    expect(pro()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("falls back to the label prop when no children are given", () => {
    render(<Radio name="plan" value="free" label="Free" />);
    expect(free()).toBeInTheDocument();
  });

  it("follows a page that keeps the choice in its own state", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [value, setValue] = useState("free");
      return (
        <>
          <Pair value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue("pro")}>
            Choose Pro
          </button>
        </>
      );
    };
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Choose Pro" }));
    expect(pro()).toBeChecked();
    expect(free()).not.toBeChecked();
    await user.click(free());
    expect(free()).toBeChecked();
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Radio name="plan" value="free" label="Free" disabled onChange={onChange} />);
    expect(free()).toBeDisabled();
    await user.click(free());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Pair />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Radio form reset", () => {
  const settle = (form: HTMLFormElement) =>
    act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

  it("restores the checked radio, and an echo of the user's choice is no new default", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [value, setValue] = useState("free");
      return (
        <form data-testid="form">
          <Pair value={value} onChange={setValue} />
        </form>
      );
    };
    render(<Page />);
    expect(free()).toHaveAttribute("checked");
    await user.click(pro());
    expect(free().defaultChecked, "the page echoing the choice moved the default").toBe(true);
    await settle(screen.getByTestId("form") as HTMLFormElement);
    expect(free()).toBeChecked();
  });

  it("takes a choice the page makes itself as the new default", async () => {
    const user = userEvent.setup();
    const Page = () => {
      const [value, setValue] = useState("free");
      return (
        <form data-testid="form">
          <Pair value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue("pro")}>
            Choose Pro
          </button>
        </form>
      );
    };
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Choose Pro" }));
    await settle(screen.getByTestId("form") as HTMLFormElement);
    expect(pro()).toBeChecked();
  });
});
