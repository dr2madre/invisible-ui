import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./breadcrumb.fixture.svelte";

describe("Breadcrumb", () => {
  it("renders a labelled navigation landmark", () => {
    render(Fixture);
    expect(document.querySelector("nav.breadcrumb")).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("links ancestors and marks the last item as the current page", () => {
    render(Fixture);
    const links = document.querySelectorAll<HTMLAnchorElement>("a.breadcrumb__link");
    expect(links).toHaveLength(2);
    const current = document.querySelector(".breadcrumb__current")!;
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveTextContent("Breadcrumb");
  });

  it("renders a home glyph for the home item", () => {
    render(Fixture);
    expect(document.querySelector(".breadcrumb__home")).not.toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
