import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-error-state>", () => {
  it("renders an announced recovery state", () => {
    document.body.innerHTML = `
      <ds-error-state title="Connection failed" description="Check the server and try again." size="sm">
        <p>Your changes are still available.</p>
      </ds-error-state>`;
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-size", "sm");
    expect(
      within(alert).getByRole("heading", { name: "Connection failed", level: 2 }),
    ).toBeVisible();
    expect(alert).toHaveTextContent("Check the server and try again.");
    expect(alert).toHaveTextContent("Your changes are still available.");
    expect(alert.querySelector(".feedback-icon")).toHaveAttribute("data-status", "danger");
  });

  it("reports one generated recovery action and stays controlled", async () => {
    const user = userEvent.setup();
    document.body.innerHTML =
      '<ds-error-state title="Connection failed" action-label="Try again"></ds-error-state>';
    const host = document.querySelector("ds-error-state")!;
    const action = vi.fn();
    host.addEventListener("action", action);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(host.isConnected).toBe(true);
  });

  it("preserves custom icon and action regions across attribute updates", () => {
    document.body.innerHTML = `
      <ds-error-state title="Not found">
        <svg slot="icon" data-testid="artwork"></svg>
        <a slot="actions" href="/">Go home</a>
      </ds-error-state>`;
    const host = document.querySelector("ds-error-state")!;
    expect(screen.getByTestId("artwork")).toBeVisible();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
    expect(host.querySelector(".feedback-icon")).toBeNull();
    host.setAttribute("title", "Still unavailable");
    expect(screen.getByTestId("artwork")).toBeVisible();
    expect(screen.getByRole("link", { name: "Go home" })).toBeVisible();
  });

  it("treats attribute content as text and has no accessibility violations", async () => {
    document.body.innerHTML =
      '<ds-error-state title="&lt;img src=x&gt;" description="Unavailable"></ds-error-state>';
    const host = document.querySelector("ds-error-state")!;
    expect(host.querySelector("img")).toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
