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
    expect(screen.getByRole("status", { name: "5" })).toHaveTextContent("5");

    host.count = 12;
    expect(screen.getByRole("status", { name: "9+" })).toHaveTextContent("9+");

    host.count = 0;
    expect(screen.queryByRole("status")).toBeNull();
    host.showZero = true;
    expect(screen.getByRole("status", { name: "0" })).toBeInTheDocument();
  });

  it("uses the fuller label without announcing the visible digits twice", () => {
    mount(`<ds-count count="3" label="3 unread messages"></ds-count>`);
    const status = screen.getByRole("status", { name: "3 unread messages" });
    expect(status.querySelector("[aria-hidden='true']")).toHaveTextContent("3");
  });

  it("supports labelled and decorative dots", () => {
    const host = mount(`<ds-count dot label="New activity"></ds-count>`);
    expect(screen.getByRole("status", { name: "New activity" })).toHaveClass("count--dot");

    host.removeAttribute("label");
    expect(document.querySelector(".count")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("reflects the status and has no accessibility violations", async () => {
    mount(`<ds-count count="2" status="info" label="2 updates"></ds-count>`);
    expect(document.querySelector(".count")).toHaveAttribute("data-status", "info");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
