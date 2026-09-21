import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsInlineNotification } from "./ds-inline-notification";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-inline-notification>", () => {
  it("renders named polite feedback by default", () => {
    document.body.innerHTML = `
      <ds-inline-notification title="Saved" description="Your changes were saved."
        status="success"></ds-inline-notification>`;
    const host = screen.getByRole("status", { name: "Saved" });
    expect(host).toHaveTextContent("Your changes were saved.");
    expect(host.querySelector(".inline-notification")).toHaveAttribute("data-status", "success");
    expect(host.querySelector(".feedback-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("supports rich light-DOM regions and reactive presentation attributes", () => {
    document.body.innerHTML = `
      <ds-inline-notification title="Connection warning" role="alert" plain>
        <strong>Work offline.</strong>
        <span slot="icon">!</span>
        <a slot="link" href="/help">Help</a>
        <button slot="actions" type="button">Retry</button>
      </ds-inline-notification>`;
    const host = screen.getByRole("alert", { name: "Connection warning" });
    expect(host).toHaveTextContent("Work offline.");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
    host.setAttribute("inverted", "");
    expect(host.querySelector(".inline-notification")).toHaveAttribute("data-inverted", "");
    expect(host.querySelector(".feedback-icon")).toHaveTextContent("!");
  });

  it("dismisses from the keyboard and reports the controlled state change", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <ds-inline-notification title="Saved" description="Done" closable
        close-label="Dismiss saved message"></ds-inline-notification>`;
    const host = document.querySelector("ds-inline-notification") as DsInlineNotification;
    const close = vi.fn();
    const change = vi.fn();
    host.addEventListener("close", close);
    host.addEventListener("open-change", change);
    const button = within(host).getByRole("button", { name: "Dismiss saved message" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(close).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
    expect(host.open).toBe(false);
    expect(host.querySelector(".inline-notification")).toBeNull();
    host.open = true;
    expect(screen.getByRole("status", { name: "Saved" })).toBeVisible();
  });

  it("treats attribute content as text and has no accessibility violations", async () => {
    document.body.innerHTML = `
      <ds-inline-notification title="&lt;img src=x&gt;" description="Safe"
        href="/details" link-text="Details"></ds-inline-notification>`;
    const host = document.querySelector("ds-inline-notification")!;
    expect(host.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute("href", "/details");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
