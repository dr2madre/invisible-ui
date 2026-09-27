import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "../empty-state/EmptyState";
import { ErrorState } from "../error-state/ErrorState";
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
    render(Link, { props: { href: "#guide" }, attrs: { onClick: pressed }, slots });

    await user.tab();
    expect(link()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("forwards click for the work that goes with the navigation", async () => {
    const pressed = vi.fn();
    render(Link, { props: { href: "#guide" }, attrs: { onClick: pressed }, slots });

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

describe("Vue Link new-tab safety", () => {
  it("adds a safe rel to a new-tab target passed as an attribute", () => {
    render(Link, { props: { href: "https://example.com" }, attrs: { target: "_blank" }, slots });
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps the consumer's rel next to the safe one", () => {
    render(Link, {
      props: { href: "https://example.com" },
      attrs: { target: "_blank", rel: "external" },
      slots,
    });
    expect(link()).toHaveAttribute("rel", "external noopener noreferrer");
  });

  it("does not let an attribute drop the safe rel of an external link", () => {
    render(Link, {
      props: { href: "https://example.com", external: true },
      attrs: { rel: "", target: "_self" },
      slots,
    });
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("leaves rel alone for a same-tab link", () => {
    render(Link, { props: { href: "/guide" }, attrs: { rel: "help" }, slots });
    expect(link()).toHaveAttribute("rel", "help");
    expect(link()).not.toHaveAttribute("target");
  });

  it.each([
    ["EmptyState", EmptyState, { title: "No results" }],
    ["ErrorState", ErrorState, { title: "Something went wrong" }],
  ] as const)("%s renders a new-tab action with a safe rel", (_name, component, base) => {
    render(component as never, {
      props: {
        ...base,
        actions: [{ label: "Docs", href: "https://example.com", target: "_blank" }],
      } as never,
    });
    const action = screen.getByRole("link", { name: "Docs" });
    expect(action).toHaveAttribute("target", "_blank");
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
  });
});
