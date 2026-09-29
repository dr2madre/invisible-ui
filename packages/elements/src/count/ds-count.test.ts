import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsCount } from "./ds-count";

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-count") as DsCount;
};

describe("<ds-count>", () => {
  it("renders, clamps and reacts to count changes", () => {
    const host = mount(`<ds-count count="5" max="9"></ds-count>`);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("5");
    expect(status).not.toHaveAttribute("aria-label");
    expect(document.querySelector(".count")).toHaveTextContent("5");

    host.count = 12;
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("9+");

    host.count = 0;
    expect(document.querySelector(".count")).toBeNull();
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
    host.showZero = true;
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("0");
  });

  it("uses the fuller label without announcing the visible digits twice", () => {
    mount(`<ds-count count="3" label="3 unread messages"></ds-count>`);
    expect(screen.getByRole("status")).toHaveTextContent("3 unread messages");
    expect(document.querySelector(".count")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".count")).toHaveTextContent("3");
  });

  it("supports labelled and decorative dots", () => {
    const host = mount(`<ds-count dot label="New activity"></ds-count>`);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("New activity");
    expect(document.querySelector(".count")).toHaveClass("count--dot");

    host.removeAttribute("label");
    expect(document.querySelector(".count")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });

  it("reflects the status and has no accessibility violations", async () => {
    mount(`<ds-count count="2" status="info" label="2 updates"></ds-count>`);
    expect(document.querySelector(".count")).toHaveAttribute("data-status", "info");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
