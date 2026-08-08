import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./link.fixture.svelte";

const link = () => document.querySelector<HTMLAnchorElement>(".link")!;

describe("Svelte Link (styled)", () => {
  it("renders a semantic link with its text and href", () => {
    render(Fixture, { props: { href: "/guide" } });
    const el = screen.getByRole("link", { name: "Read the guide" });
    expect(el).toHaveAttribute("href", "/guide");
    expect(el).toHaveAttribute("data-variant", "primary");
  });

  it("reflects the subtle variant", () => {
    render(Fixture, { props: { href: "/guide", variant: "subtle" } });
    expect(link()).toHaveAttribute("data-variant", "subtle");
  });

  it("opens external links in a new tab with a safe rel", () => {
    render(Fixture, { props: { href: "https://example.com", external: true } });
    const el = link();
    expect(el).toHaveAttribute("target", "_blank");
    expect(el).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("marks the external icon as decorative so it is not announced", () => {
    render(Fixture, { props: { href: "https://example.com", external: true } });
    const icon = document.querySelector(".link__external")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    // The icon adds nothing to the accessible name.
    expect(screen.getByRole("link", { name: "Read the guide" })).toBeInTheDocument();
  });

  it("stays internal by default (no target/rel, no icon)", () => {
    render(Fixture, { props: { href: "/guide" } });
    expect(link()).not.toHaveAttribute("target");
    expect(link()).not.toHaveAttribute("rel");
    expect(document.querySelector(".link__external")).toBeNull();
  });

  it("takes one tab stop and activates on Enter", async () => {
    const user = userEvent.setup();
    const pressed = vi.fn();
    // A fragment href keeps jsdom from attempting a document navigation.
    render(Fixture, { props: { href: "#guide", onclick: pressed } });

    await user.tab();
    expect(link()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("forwards click for the work that goes with the navigation", async () => {
    const pressed = vi.fn();
    render(Fixture, { props: { href: "#guide", onclick: pressed } });

    await fireEvent.click(link());
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { href: "/guide" } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when external", async () => {
    const { container } = render(Fixture, {
      props: { href: "https://example.com", external: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
