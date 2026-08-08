import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Link } from "./Link";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const link = () => document.querySelector<HTMLAnchorElement>(".link")!;
const slots = { default: "Read the guide" };

describe("Vue Link (styled)", () => {
  it("renders a semantic link with its text and href", () => {
    render(Link, { props: { href: "/guide" }, slots });
    const el = screen.getByRole("link", { name: "Read the guide" });
    expect(el).toHaveAttribute("href", "/guide");
    expect(el).toHaveAttribute("data-variant", "primary");
  });

  it("reflects the subtle variant", () => {
    render(Link, { props: { href: "/guide", variant: "subtle" }, slots });
    expect(link()).toHaveAttribute("data-variant", "subtle");
  });

  it("opens external links in a new tab with a safe rel", () => {
    render(Link, { props: { href: "https://example.com", external: true }, slots });
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("marks the external icon as decorative so it is not announced", () => {
    render(Link, { props: { href: "https://example.com", external: true }, slots });
    const icon = document.querySelector(".link__external")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    // The icon adds nothing to the accessible name.
    expect(screen.getByRole("link", { name: "Read the guide" })).toBeInTheDocument();
  });

  it("stays internal by default (no target/rel, no icon)", () => {
    render(Link, { props: { href: "/guide" }, slots });
    expect(link()).not.toHaveAttribute("target");
    expect(link()).not.toHaveAttribute("rel");
    expect(document.querySelector(".link__external")).toBeNull();
  });

  it("takes one tab stop and activates on Enter", async () => {
    const user = userEvent.setup();
    const pressed = vi.fn();
    // A fragment href keeps jsdom from attempting a document navigation.
    render(Link, { props: { href: "#guide", onClick: pressed }, slots });

    await user.tab();
    expect(link()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("forwards click for the work that goes with the navigation", async () => {
    const pressed = vi.fn();
    render(Link, { props: { href: "#guide", onClick: pressed }, slots });

    await fireEvent.click(link());
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Link, { props: { href: "/guide" }, slots });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  it("has no accessibility violations when external", async () => {
    const { container } = render(Link, {
      props: { href: "https://example.com", external: true },
      slots,
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
