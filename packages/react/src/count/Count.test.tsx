import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Count } from "./Count";

describe("React Count", () => {
  it("renders the number", () => {
    render(<Count count={5} />);
    expect(screen.getByRole("status", { name: "5" })).toHaveTextContent("5");
  });

  it("shows N+ past max", () => {
    render(<Count count={120} max={99} />);
    expect(screen.getByRole("status")).toHaveTextContent("99+");
  });

  it("hides itself at zero by default", () => {
    const { container } = render(<Count count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows zero when showZero is set", () => {
    render(<Count count={0} showZero />);
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("exposes a fuller accessible name and hides the digits", () => {
    render(<Count count={3} label="3 unread messages" status="info" />);
    const count = screen.getByRole("status", { name: "3 unread messages" });
    expect(count).toHaveAttribute("data-status", "info");
    expect(count.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a bare dot with no number in dot mode", () => {
    render(<Count dot count={7} label="Online" />);
    const dot = screen.getByRole("status", { name: "Online" });
    expect(dot).toHaveClass("count--dot");
    expect(dot).toBeEmptyDOMElement();
  });

  it("is decorative when a dot has no label", () => {
    render(<Count dot />);
    const dot = document.querySelector(".count--dot")!;
    expect(dot).toHaveAttribute("aria-hidden", "true");
    expect(dot).not.toHaveAttribute("role");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Count count={3} label="3 unread messages" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
