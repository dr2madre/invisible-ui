import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Count from "./Count.svelte";

const count = () => document.querySelector<HTMLElement>(".count");

describe("Count", () => {
  it("renders the number", () => {
    render(Count, { props: { count: 5 } });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("clamps past max as 'N+'", () => {
    render(Count, { props: { count: 150, max: 99 } });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides itself at zero by default", () => {
    render(Count, { props: { count: 0 } });
    expect(count()).toBeNull();
  });

  it("shows zero when showZero is set", () => {
    render(Count, { props: { count: 0, showZero: true } });
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("exposes a fuller accessible label and hides the digits from AT", () => {
    render(Count, { props: { count: 3, label: "3 unread messages" } });
    const el = screen.getByRole("status", { name: "3 unread messages" });
    expect(el).toBe(count());
    // The visible digits are hidden so they aren't announced twice.
    expect(el.querySelector("[aria-hidden='true']")).toHaveTextContent("3");
  });

  it("renders a bare dot with no number in dot mode", () => {
    render(Count, { props: { dot: true, label: "New activity" } });
    const el = count()!;
    expect(el).toHaveClass("count--dot");
    expect(el).toHaveTextContent("");
    expect(el).toHaveAttribute("aria-label", "New activity");
  });

  it("is decorative when a dot has no label", () => {
    render(Count, { props: { dot: true } });
    expect(count()).toHaveAttribute("aria-hidden", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Count, { props: { count: 3, label: "3 unread" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
