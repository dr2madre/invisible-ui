import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/", home: true },
  { label: "Components", href: "/components" },
  { label: "Breadcrumb" },
];

describe("React Breadcrumb", () => {
  it("renders a labelled navigation landmark around an ordered list", () => {
    render(<Breadcrumb items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav.querySelector("ol.breadcrumb__list")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("names the landmark from the catalog, or from the label", () => {
    const { unmount } = render(
      <LocaleProvider locale="it" messages={{ "breadcrumb.label": "Percorso" }}>
        <Breadcrumb items={items} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Percorso" })).toBeInTheDocument();
    unmount();
    render(<Breadcrumb items={items} label="You are here" />);
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("links ancestors and marks the last item as the current page", () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("href", "/components");
    const current = document.querySelector(".breadcrumb__current")!;
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveTextContent("Breadcrumb");
  });

  it("renders a home glyph whose link keeps its name for screen readers", () => {
    render(<Breadcrumb items={items} />);
    expect(document.querySelector(".breadcrumb__home")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("draws decorative separators between items", () => {
    render(<Breadcrumb items={items} separator="›" />);
    const separators = document.querySelectorAll(".breadcrumb__sep");
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator).toHaveTextContent("›");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Breadcrumb items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
