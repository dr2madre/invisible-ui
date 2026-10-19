import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./popup-direction.fixture.svelte";

// A popup is portalled out of the wrapper, so it takes the direction of the
// control that opens it rather than the page's.
describe("Svelte popups in a plain dir wrapper", () => {
  it("a menu that stays mounted reads the direction each time it opens", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { dir: "rtl" } });
    const popup = document.querySelector<HTMLElement>(".menu__popup")!;
    expect(popup.closest("[data-testid=wrapper]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(popup).toHaveAttribute("dir", "rtl");
    await user.keyboard("{Escape}");
    await rerender({ dir: "ltr" });
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(popup).toHaveAttribute("dir", "ltr");
  });

  it("a tooltip takes the direction of its trigger", async () => {
    render(Fixture, { props: { dir: "rtl" } });
    screen.getByRole("button", { name: "Info" }).focus();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveAttribute("dir", "rtl");
  });
});
