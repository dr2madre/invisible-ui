import { fireEvent, screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import { initialsOf } from "./ds-avatar";

describe("<ds-avatar>", () => {
  it("derives initials from the first and last word", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    expect(initialsOf("Grace Brewster Hopper")).toBe("GH");
    expect(initialsOf("Cher")).toBe("CH");
    expect(initialsOf("   ")).toBe("?");
  });

  it("is one named image showing the initials without a src", () => {
    document.body.innerHTML = `<ds-avatar name="Ada Lovelace"></ds-avatar>`;
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(avatar).toHaveTextContent("AL");
    expect(avatar).toHaveAttribute("data-size", "md");
    expect(avatar).toHaveAttribute("data-shape", "circle");
  });

  it("shows the image, then falls back to initials when it fails to load", () => {
    document.body.innerHTML = `<ds-avatar name="Ada Lovelace" src="/ada.png" size="lg" shape="square"></ds-avatar>`;
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    const img = avatar.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
    fireEvent.error(img);
    expect(avatar.querySelector("img")).toBeNull();
    expect(avatar).toHaveTextContent("AL");
    expect(avatar).toHaveAttribute("data-size", "lg");
  });

  it("takes alt as the accessible name", () => {
    document.body.innerHTML = `<ds-avatar name="Ada Lovelace" alt="Your account"></ds-avatar>`;
    expect(screen.getByRole("img", { name: "Your account" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = `<ds-avatar name="Ada Lovelace"></ds-avatar>`;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
