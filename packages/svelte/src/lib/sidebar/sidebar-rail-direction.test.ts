import { render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fixture from "./sidebar.fixture.svelte";

// Records the placement the rail tooltip asks for when it opens.
const attachFloating = vi.hoisted(() => vi.fn(() => () => {}));
vi.mock("../internal/floating", () => ({ attachFloating }));

afterEach(() => {
  document.documentElement.removeAttribute("dir");
  attachFloating.mockClear();
});

const placementOnFocus = async () => {
  const { unmount } = render(Fixture, { props: { collapsed: true } });
  screen.getByRole("button", { name: "Home" }).focus();
  await vi.waitFor(() => expect(attachFloating).toHaveBeenCalled());
  const options = (attachFloating.mock.calls.at(-1) as unknown[])[2] as { placement: string };
  unmount();
  return options.placement;
};

describe("Svelte Sidebar rail tooltip direction", () => {
  it("places the tooltip at the inline end, on the left in right-to-left text", async () => {
    expect(await placementOnFocus()).toBe("right");
    attachFloating.mockClear();
    document.documentElement.dir = "rtl";
    expect(await placementOnFocus()).toBe("left");
  });
});
