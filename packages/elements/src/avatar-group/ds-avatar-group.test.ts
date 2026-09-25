import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { AvatarGroupItem, DsAvatarGroup } from "./ds-avatar-group";

const items: AvatarGroupItem[] = [
  { name: "Ada Lovelace", color: "#e0d4f7" },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Edsger Dijkstra" },
  { name: "Barbara Liskov" },
];

const mount = (attributes = 'label="Project team"') => {
  document.body.innerHTML = `<ds-avatar-group ${attributes}></ds-avatar-group>`;
  const group = document.querySelector("ds-avatar-group") as DsAvatarGroup;
  group.items = items;
  return group;
};

describe("<ds-avatar-group>", () => {
  it("is a labelled group", () => {
    mount();
    expect(screen.getByRole("group", { name: "Project team" })).toHaveClass("avatar-group");
  });

  it("shows up to max avatars and collapses the rest into a +N chip", () => {
    mount('label="Project team" max="4"');
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2 more" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Edsger Dijkstra" })).not.toBeInTheDocument();
  });

  it("renders no overflow chip when everyone fits", () => {
    mount('label="Project team" max="10"');
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Barbara Liskov" })).toBeInTheDocument();
  });

  it("passes size and shape to every avatar and the chip", () => {
    mount('label="Project team" size="sm" shape="square"');
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute("data-size", "sm");
    const chip = screen.getByRole("img", { name: "2 more" });
    expect(chip).toHaveAttribute("data-size", "sm");
    expect(chip).toHaveAttribute("data-shape", "square");
  });

  it("tints an initials avatar through a custom property", () => {
    mount();
    const wrapper = document.querySelector<HTMLElement>(".avatar-group__item")!;
    expect(wrapper.style.getPropertyValue("--ds-avatar-bg")).toBe("#e0d4f7");
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
