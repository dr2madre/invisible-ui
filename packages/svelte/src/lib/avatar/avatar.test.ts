import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Avatar from "./Avatar.svelte";
import { initialsOf } from "./Avatar.svelte";

describe("initialsOf", () => {
  it("uses first + last initials, or two letters for one word", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    expect(initialsOf("Grace Brewster Murray Hopper")).toBe("GH");
    expect(initialsOf("madonna")).toBe("MA");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("Avatar", () => {
  it("shows initials when there is no image, exposed as one labelled image", () => {
    render(Avatar, { props: { name: "Ada Lovelace" } });
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(avatar).toHaveTextContent("AL");
  });

  it("renders the image when a src is provided", () => {
    const { container } = render(Avatar, { props: { name: "Grace Hopper", src: "/grace.jpg" } });
    const img = container.querySelector("img.avatar__img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/grace.jpg");
  });

  it("falls back to initials when the image fails to load", async () => {
    const { container } = render(Avatar, { props: { name: "Grace Hopper", src: "/broken.jpg" } });
    const img = container.querySelector("img.avatar__img")!;
    await fireEvent.error(img);
    expect(container.querySelector("img.avatar__img")).toBeNull();
    expect(screen.getByRole("img", { name: "Grace Hopper" })).toHaveTextContent("GH");
  });

  it("uses a custom alt as the accessible name", () => {
    render(Avatar, { props: { name: "AL", alt: "Ada Lovelace, admin" } });
    expect(screen.getByRole("img", { name: "Ada Lovelace, admin" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Avatar, { props: { name: "Ada Lovelace" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
