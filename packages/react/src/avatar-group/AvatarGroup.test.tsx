import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { AvatarGroup, type AvatarGroupItem } from "./AvatarGroup";

const team: AvatarGroupItem[] = [
  { name: "Ada Lovelace" },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Edsger Dijkstra" },
  { name: "Barbara Liskov" },
];

describe("React AvatarGroup", () => {
  it("is a labelled group", () => {
    render(<AvatarGroup items={team} label="Project team" />);
    expect(screen.getByRole("group", { name: "Project team" })).toHaveClass("avatar-group");
  });

  it("shows up to max avatars and collapses the rest into a +N chip", () => {
    render(<AvatarGroup items={team} max={3} label="Project team" />);
    expect(document.querySelectorAll(".avatar")).toHaveLength(3);
    const chip = screen.getByRole("img", { name: "3 more" });
    expect(chip).toHaveClass("avatar-group__overflow");
    expect(chip).toHaveTextContent("+3");
  });

  it("names the chip from the catalog", () => {
    render(
      <LocaleProvider locale="it" messages={{ "avatarGroup.more": "altri {count}" }}>
        <AvatarGroup items={team} max={4} label="Squadra" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("img", { name: "altri 2" })).toBeInTheDocument();
  });

  it("renders no chip when everyone fits", () => {
    render(<AvatarGroup items={team.slice(0, 2)} label="Pair" />);
    expect(document.querySelector(".avatar-group__overflow")).toBeNull();
  });

  it("renders two people who share a name", () => {
    render(
      <AvatarGroup items={[{ name: "Ada Lovelace" }, { name: "Ada Lovelace" }]} label="Twins" />,
    );
    expect(screen.getAllByRole("img", { name: "Ada Lovelace" })).toHaveLength(2);
  });

  it("applies a colour as that one value and drops one that would add declarations", () => {
    render(
      <AvatarGroup
        label="Team"
        items={[
          { name: "Ada Lovelace", color: "rebeccapurple" },
          { name: "Grace Hopper", color: "red; position: fixed; inset: 0" },
        ]}
      />,
    );
    const [safe, unsafe] = document.querySelectorAll<HTMLElement>(".avatar-group__item");
    expect(safe!.style.getPropertyValue("--ds-avatar-bg")).toBe("rebeccapurple");
    expect(unsafe!.getAttribute("style") ?? "").not.toContain("position");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AvatarGroup items={team} max={4} label="Project team" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
