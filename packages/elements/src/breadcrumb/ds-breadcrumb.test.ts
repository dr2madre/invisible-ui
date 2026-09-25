import { screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { BreadcrumbItem, DsBreadcrumb } from "./ds-breadcrumb";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/", home: true },
  { label: "Components", href: "/components" },
  { label: "Breadcrumb" },
];

const mount = (attributes = "") => {
  document.body.innerHTML = `<ds-breadcrumb ${attributes}></ds-breadcrumb>`;
  const breadcrumb = document.querySelector("ds-breadcrumb") as DsBreadcrumb;
  breadcrumb.items = items;
  return breadcrumb;
};

describe("<ds-breadcrumb>", () => {
  it("renders a labelled navigation landmark", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveClass("breadcrumb");
  });

  it("takes the landmark name from label", () => {
    mount('label="You are here"');
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("links ancestors and marks the last item as the current page", () => {
    mount();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("href", "/components");
    const current = document.querySelector(".breadcrumb__current")!;
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveTextContent("Breadcrumb");
  });

  it("renders a home glyph and keeps the home label for screen readers", () => {
    mount();
    const home = screen.getByRole("link", { name: "Home" });
    expect(home.querySelector(".breadcrumb__home")).toHaveAttribute("aria-hidden", "true");
    expect(home.querySelector(".breadcrumb__sr")).toHaveTextContent("Home");
  });

  it("draws decorative separators between items", () => {
    mount('separator="›"');
    const separators = document.querySelectorAll(".breadcrumb__sep");
    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveTextContent("›");
    expect(separators[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("renders labels as text, never as markup", () => {
    const breadcrumb = mount();
    breadcrumb.items = [{ label: "<img src=x onerror=alert(1)>" }];
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
