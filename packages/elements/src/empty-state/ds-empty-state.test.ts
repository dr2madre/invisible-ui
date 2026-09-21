import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-empty-state>", () => {
  it("renders an autonomous empty collection state", () => {
    document.body.innerHTML = `
      <ds-empty-state title="No rules yet" description="Create the first rule." size="sm">
        <p>Rules run in order.</p>
      </ds-empty-state>`;
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-size", "sm");
    expect(within(status).getByRole("heading", { name: "No rules yet", level: 2 })).toBeVisible();
    expect(status).toHaveTextContent("Create the first rule.");
    expect(status).toHaveTextContent("Rules run in order.");
    expect(status.querySelector(".feedback-icon")).toHaveAttribute("data-status", "neutral");
  });

  it("reports one generated action and stays controlled", async () => {
    const user = userEvent.setup();
    document.body.innerHTML =
      '<ds-empty-state title="No indexes" action-label="Add index"></ds-empty-state>';
    const host = document.querySelector("ds-empty-state")!;
    const action = vi.fn();
    host.addEventListener("action", action);
    await user.click(screen.getByRole("button", { name: "Add index" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(host.isConnected).toBe(true);
  });

  it("preserves custom illustration and action regions across attribute updates", () => {
    document.body.innerHTML = `
      <ds-empty-state title="Nothing here">
        <svg slot="illustration" data-testid="artwork"></svg>
        <a slot="actions" href="/create">Create</a>
      </ds-empty-state>`;
    const host = document.querySelector("ds-empty-state")!;
    expect(screen.getByTestId("artwork")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute("href", "/create");
    expect(host.querySelector(".feedback-icon")).toBeNull();
    host.setAttribute("title", "Still empty");
    expect(screen.getByTestId("artwork")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create" })).toBeVisible();
  });

  it("treats attribute content as text and has no accessibility violations", async () => {
    document.body.innerHTML =
      '<ds-empty-state title="&lt;img src=x&gt;" description="No results"></ds-empty-state>';
    const host = document.querySelector("ds-empty-state")!;
    expect(host.querySelector("img")).toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
