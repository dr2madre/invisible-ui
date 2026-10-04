import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Link, type LinkProps } from "./Link";

const Guide = (props: Omit<LinkProps, "children">) => <Link {...props}>Read the guide</Link>;
const link = () => document.querySelector<HTMLAnchorElement>(".link")!;

describe("React Link", () => {
  it("renders a semantic link with its text and href", () => {
    render(<Guide href="/guide" />);
    const el = screen.getByRole("link", { name: "Read the guide" });
    expect(el).toHaveAttribute("href", "/guide");
    expect(el).toHaveAttribute("data-variant", "primary");
  });

  it("reflects the subtle variant", () => {
    render(<Guide href="/guide" variant="subtle" />);
    expect(link()).toHaveAttribute("data-variant", "subtle");
  });

  it("opens external links in a new tab with a safe rel", () => {
    render(<Guide href="https://example.com" external />);
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("adds the safe rel when a new tab comes in as a plain target", () => {
    render(<Guide href="https://example.com" target="_blank" rel="author" />);
    expect(link()).toHaveAttribute("target", "_blank");
    expect(link()).toHaveAttribute("rel", "author noopener noreferrer");
  });

  it("marks the external icon as decorative so it is not announced", () => {
    render(<Guide href="https://example.com" external />);
    const icon = document.querySelector(".link__external")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(screen.getByRole("link", { name: "Read the guide" })).toBeInTheDocument();
  });

  it("stays internal by default (no target, no rel, no icon)", () => {
    render(<Guide href="/guide" />);
    expect(link()).not.toHaveAttribute("target");
    expect(link()).not.toHaveAttribute("rel");
    expect(document.querySelector(".link__external")).toBeNull();
  });

  it("takes one tab stop and activates on Enter", async () => {
    const user = userEvent.setup();
    const pressed = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    // A fragment href keeps jsdom from attempting a document navigation.
    render(<Guide href="#guide" onClick={pressed} />);
    await user.tab();
    expect(link()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it("forwards click and a ref for the work that goes with the navigation", () => {
    const pressed = vi.fn();
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link href="#guide" onClick={pressed} ref={ref}>
        Read the guide
      </Link>,
    );
    fireEvent.click(link());
    expect(pressed).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(link());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Guide href="/guide" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when external", async () => {
    const { container } = render(<Guide href="https://example.com" external />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
