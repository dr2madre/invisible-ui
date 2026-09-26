import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsRadio } from "./ds-radio";

const pair = `<ds-radio name="plan" value="free" checked>Free</ds-radio>
<ds-radio name="plan" value="pro">Pro</ds-radio>`;

const mount = (html: string) => {
  document.body.innerHTML = html;
  return [...document.querySelectorAll("ds-radio")] as DsRadio[];
};

describe("<ds-radio>", () => {
  it("renders labelled native radios that share a group name", () => {
    mount(pair);
    const free = screen.getByRole("radio", { name: "Free" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    expect(free).toBeChecked();
    expect(pro).not.toBeChecked();
    expect(free).toHaveAttribute("name", "plan");
    expect(pro).toHaveAttribute("name", "plan");
  });

  it("reports the value when a radio is chosen", async () => {
    const user = userEvent.setup();
    const [free, pro] = mount(pair);
    const seen: string[] = [];
    document.body.addEventListener("change", (event) =>
      seen.push((event as CustomEvent).detail.value),
    );

    await user.click(screen.getByRole("radio", { name: "Pro" }));

    expect(seen).toEqual(["pro"]);
    // The browser unchecked the other radio; the property reads that.
    expect(pro!.checked).toBe(true);
    expect(free!.checked).toBe(false);
  });

  it("is selectable by clicking its label", async () => {
    const user = userEvent.setup();
    mount(pair);
    await user.click(screen.getByText("Pro"));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("moves the selection with the arrow keys, taking one tab stop", async () => {
    const user = userEvent.setup();
    mount(pair.replace(" checked", ""));

    await user.tab();
    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    await user.tab();
    expect(screen.queryAllByRole("radio")).not.toContain(document.activeElement);
  });

  it("falls back to the label attribute when it has no children", () => {
    mount(`<ds-radio name="plan" value="team" label="Team"></ds-radio>`);
    expect(screen.getByRole("radio", { name: "Team" })).toBeInTheDocument();
  });

  it("submits its value under the name when checked", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form>${pair}</form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("plan")).toBe("free");

    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(new FormData(form).get("plan")).toBe("pro");
  });

  it("follows the checked attribute after mount", () => {
    const [, pro] = mount(pair);
    pro!.checked = true;
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
  });

  it("keeps a choice when an unrelated attribute changes", async () => {
    const user = userEvent.setup();
    const [free] = mount(pair);
    await user.click(screen.getByRole("radio", { name: "Pro" }));

    free!.setAttribute("value", "basic");
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("turns disabled on and off after mount", async () => {
    const user = userEvent.setup();
    const [, pro] = mount(pair);
    const radio = screen.getByRole("radio", { name: "Pro" });

    pro!.setAttribute("disabled", "");
    expect(radio).toBeDisabled();
    expect(radio.closest("label")).toHaveClass("radio--disabled");
    await user.click(radio);
    expect(radio).not.toBeChecked();

    pro!.removeAttribute("disabled");
    await user.click(radio);
    expect(radio).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    mount(`<fieldset><legend>Plan</legend>${pair}</fieldset>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
