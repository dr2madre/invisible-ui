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
      <ds-error-state live title="Connection failed" description="Check the server and try again." size="sm">
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

  it("has no live role unless live is set", () => {
    document.body.innerHTML = '<ds-error-state title="Nothing here"></ds-error-state>';
    const host = document.querySelector("ds-error-state")!;
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    host.setAttribute("live", "");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing here");
    host.setAttribute("live", "false");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("updates in place instead of rebuilding on attribute changes", () => {
    document.body.innerHTML = `
      <ds-error-state live title="Nothing here" description="Try again later." action-label="Retry">
        <p>Supporting text.</p>
      </ds-error-state>`;
    const host = document.querySelector("ds-error-state")!;
    const region = screen.getByRole("alert");
    const heading = screen.getByRole("heading", { name: "Nothing here" });
    const description = screen.getByText("Try again later.");
    const button = screen.getByRole("button", { name: "Retry" });
    const icon = region.querySelector(".feedback-icon");

    host.setAttribute("size", "sm");
    host.setAttribute("status", "info");
    expect(screen.getByRole("alert")).toBe(region);
    expect(region).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBe(heading);
    expect(screen.getByText("Try again later.")).toBe(description);
    expect(screen.getByRole("button", { name: "Retry" })).toBe(button);
    expect(region.querySelector(".feedback-icon")).toBe(icon);
    expect(icon).toHaveAttribute("data-status", "info");

    host.setAttribute("title", "Still nothing");
    expect(heading).toHaveTextContent("Still nothing");
    expect(screen.getByRole("alert")).toBe(region);

    host.removeAttribute("description");
    expect(screen.queryByText("Try again later.")).toBeNull();
    host.setAttribute("description", "Back soon.");
    expect(heading.nextElementSibling).toHaveTextContent("Back soon.");
    host.removeAttribute("action-label");
    expect(screen.queryByRole("button")).toBeNull();
    host.setAttribute("action-label", "Reload");
    expect(screen.getByRole("button", { name: "Reload" })).toBe(button);
    expect(region.lastElementChild).toBe(button.parentElement);

    host.setAttribute("heading-level", "3");
    expect(screen.getByRole("heading", { name: "Still nothing", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBe(region);
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
