import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Tabs from "./Tabs.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

describe("Svelte Tabs (styled)", () => {
  it("renders a named tab list with the selected tab active", () => {
    render(Tabs, { props: { items, label: "Settings", value: "account" } });
    expect(screen.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();

    const account = screen.getByRole("tab", { name: "Account" });
    expect(account).toHaveAttribute("aria-selected", "true");
    expect(account).toHaveAttribute("data-state", "active");
  });

  it("shows only the selected panel and switches on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Tabs, { props: { items, label: "Settings", value: "account", onValueChange } });

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account settings.");

    await user.click(screen.getByRole("tab", { name: "Password" }));
    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password settings.");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Tabs, {
      props: { items, label: "Settings", value: "account" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
