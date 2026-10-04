import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Avatar, initialsOf } from "./Avatar";

describe("initialsOf", () => {
  it("uses the first and last initials, or two letters for one word", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    expect(initialsOf("Grace Brewster Murray Hopper")).toBe("GH");
    expect(initialsOf("plato")).toBe("PL");
    expect(initialsOf("   ")).toBe("?");
  });

  it("counts an emoji or a combined character as one initial", () => {
    expect(initialsOf("👩‍💻 Coder")).toBe("👩‍💻C");
  });
});

describe("React Avatar", () => {
  it("shows the initials when there is no image, exposed as one labelled image", () => {
    render(<Avatar name="Ada Lovelace" />);
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(avatar).toHaveAttribute("data-size", "md");
    expect(avatar).toHaveAttribute("data-shape", "circle");
    expect(avatar.querySelector(".avatar__initials")).toHaveAttribute("aria-hidden", "true");
    expect(avatar).toHaveTextContent("AL");
  });

  it("renders the image when a src is given", () => {
    render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    const img = document.querySelector("img.avatar__img")!;
    expect(img).toHaveAttribute("src", "/ada.png");
    expect(img).toHaveAttribute("alt", "");
  });

  it("falls back to the initials when the image fails, and tries a new src", () => {
    const { rerender } = render(<Avatar name="Ada Lovelace" src="/broken.png" />);
    fireEvent.error(document.querySelector("img.avatar__img")!);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("AL");

    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(document.querySelector("img.avatar__img")).toHaveAttribute("src", "/ada.png");
  });

  it("uses a custom alt as the accessible name", () => {
    render(<Avatar name="Ada Lovelace" alt="Ada, project lead" size="lg" shape="square" />);
    const avatar = screen.getByRole("img", { name: "Ada, project lead" });
    expect(avatar).toHaveAttribute("data-size", "lg");
    expect(avatar).toHaveAttribute("data-shape", "square");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Avatar name="Ada Lovelace" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
