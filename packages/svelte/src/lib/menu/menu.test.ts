import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./menu.fixture.svelte";

describe("Menu", () => {
  it("renders a labelled navigation landmark with sections", () => {
    render(Fixture);
    expect(document.querySelector("nav.menu")).toHaveAttribute("aria-label", "Main");
    expect(document.querySelectorAll(".menu__section")).toHaveLength(2);
  });

  it("marks the active item with aria-current", () => {
    render(Fixture);
    const active = document.querySelector(".menu__item--active")!;
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveTextContent("Home");
  });

  it("emits onSelect when a non-link item is clicked", async () => {
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    const items = document.querySelectorAll<HTMLButtonElement>("button.menu__item");
    await fireEvent.click(items[1]);
    expect(onSelect).toHaveBeenCalledWith("search");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
