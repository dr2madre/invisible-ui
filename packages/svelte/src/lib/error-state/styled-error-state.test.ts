import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./error-state.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ErrorState", () => {
  it("is an alert region with a heading, description and recovery button", () => {
    render(Fixture);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Couldn't connect to the server" }),
    ).toBeInTheDocument();
    expect(screen.getByText("An unknown error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("has no close control — an error state is not dismissable", () => {
    render(Fixture);
    // The only control is the recovery action.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("runs the recovery action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(Fixture, { props: { onAction } });
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
