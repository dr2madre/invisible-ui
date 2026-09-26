import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./avatar-group.fixture.svelte";

describe("Svelte AvatarGroup (styled)", () => {
  it("is a labelled group", () => {
    render(Fixture, { props: { label: "Project team" } });
    expect(screen.getByRole("group", { name: "Project team" })).toBeInTheDocument();
  });

  it("shows up to `max` avatars and collapses the rest into a +N chip", () => {
    render(Fixture, { props: { max: 4 } });
    // 6 people, max 4 → 4 avatars + a "+2" overflow chip.
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2 more" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    // The 5th person is hidden behind the overflow chip.
    expect(screen.queryByRole("img", { name: "Edsger Dijkstra" })).not.toBeInTheDocument();
  });

  it("renders no overflow chip when everyone fits", () => {
    render(Fixture, { props: { max: 10 } });
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Barbara Liskov" })).toBeInTheDocument();
  });

  it("renders two people who share a name", () => {
    render(Fixture, { props: { items: [{ name: "Ada Lovelace" }, { name: "Ada Lovelace" }] } });
    expect(screen.getAllByRole("img", { name: "Ada Lovelace" })).toHaveLength(2);
  });

  it("applies a colour as that one value and drops one that would add declarations", () => {
    render(Fixture, {
      props: {
        items: [
          { name: "Ada Lovelace", color: "rebeccapurple" },
          { name: "Grace Hopper", color: "red; position: fixed; inset: 0" },
        ],
      },
    });
    const [safe, unsafe] = document.querySelectorAll<HTMLElement>(".avatar-group__item");
    expect(safe!.style.getPropertyValue("--ds-avatar-bg")).toBe("rebeccapurple");
    expect(unsafe!.getAttribute("style") ?? "").not.toContain("position");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { max: 4, label: "Project team" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
