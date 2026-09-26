import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";

describe("<ds-button> badge", () => {
  it("puts the badge beside the button and describes the button with it", () => {
    document.body.innerHTML = `
      <ds-button icon-only variant="ghost" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
        <ds-count slot="badge" count="3" label="3 unread notifications"></ds-count>
      </ds-button>`;
    const button = screen.getByRole("button", { name: "Notifications" });
    // jsdom's name computation skips the label of a nested status region; the
    // browser test checks the description itself.
    const badge = document.getElementById(button.getAttribute("aria-describedby")!)!;
    expect(badge).toHaveClass("button__badge");
    expect(badge.querySelector("[aria-label]")).toHaveAttribute(
      "aria-label",
      "3 unread notifications",
    );
    expect(button).not.toContainElement(badge as HTMLElement);
    expect(document.querySelector("ds-button")).toHaveClass("button__badge-anchor");
  });

  it("takes a status dot", () => {
    document.body.innerHTML = `
      <ds-button icon-only aria-label="Inbox">
        <ds-count slot="badge" dot status="success" label="New messages"></ds-count>
      </ds-button>`;
    const button = screen.getByRole("button", { name: "Inbox" });
    const badge = document.getElementById(button.getAttribute("aria-describedby")!)!;
    expect(badge.querySelector("[aria-label]")).toHaveAttribute("aria-label", "New messages");
  });

  it("renders no badge when none is given", () => {
    document.body.innerHTML = `<ds-button>Save</ds-button>`;
    expect(document.querySelector(".button__badge")).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `
      <ds-button icon-only aria-label="Notifications">
        <ds-count slot="badge" count="3" label="3 unread notifications"></ds-count>
      </ds-button>`;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
