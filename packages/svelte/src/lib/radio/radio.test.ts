import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./radio.fixture.svelte";

describe("Svelte Radio", () => {
  it("renders labelled radios that share a group name", () => {
    render(Fixture, { props: { value: "free" } });
    const free = screen.getByRole("radio", { name: "Free" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    expect(free).toBeChecked();
    expect(pro).not.toBeChecked();
    expect(free).toHaveAttribute("name", "plan");
    expect(pro).toHaveAttribute("name", "plan");
  });

  it("reports the value when a radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(Fixture, { props: { value: "free", onChange } });
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("is selectable by clicking its label", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: "free" } });
    await user.click(screen.getByText("Pro"));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: "free" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
