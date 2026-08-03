import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/", home: true },
  { label: "Components", href: "/components" },
  { label: "Breadcrumb" },
];

describe("Vue Breadcrumb", () => {
  it("renders a labelled navigation landmark", () => {
    render(Breadcrumb, { props: { items } });
    expect(document.querySelector("nav.breadcrumb")).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("links ancestors and marks the last item as the current page", () => {
    render(Breadcrumb, { props: { items } });
    const links = document.querySelectorAll<HTMLAnchorElement>("a.breadcrumb__link");
    expect(links).toHaveLength(2);
    const current = document.querySelector(".breadcrumb__current")!;
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveTextContent("Breadcrumb");
  });

  it("renders a home glyph for the home item", () => {
    render(Breadcrumb, { props: { items } });
    expect(document.querySelector(".breadcrumb__home")).not.toBeNull();
  });

  it("takes the landmark label from the locale catalog", () => {
    render(LocaleProvider, {
      props: { messages: { "breadcrumb.label": "Percorso" } },
      slots: { default: () => h(Breadcrumb, { items }) },
    });
    expect(screen.getByRole("navigation", { name: "Percorso" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Breadcrumb, { props: { items } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
