import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AvatarGroup, type AvatarGroupItem } from "./AvatarGroup";

const items: AvatarGroupItem[] = [
  { name: "Ada Lovelace" },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Edsger Dijkstra" },
  { name: "Barbara Liskov" },
];

describe("Vue AvatarGroup (styled)", () => {
  it("is a labelled group", () => {
    render(AvatarGroup, { props: { items, label: "Project team" } });
    expect(screen.getByRole("group", { name: "Project team" })).toBeInTheDocument();
  });

  it("shows up to `max` avatars and collapses the rest into a +N chip", () => {
    render(AvatarGroup, { props: { items, max: 4, label: "Project team" } });
    // 6 people, max 4: 4 avatars + a "+2" overflow chip.
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2 more" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    // The 5th person is hidden behind the overflow chip.
    expect(screen.queryByRole("img", { name: "Edsger Dijkstra" })).not.toBeInTheDocument();
  });

  it("renders no overflow chip when everyone fits", () => {
    render(AvatarGroup, { props: { items, max: 10, label: "Project team" } });
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Barbara Liskov" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(AvatarGroup, { props: { items, max: 4, label: "Project team" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
