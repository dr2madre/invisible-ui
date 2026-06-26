import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./i18n.fixture.svelte";

describe("LocaleProvider", () => {
  it("supplies localized labels to descendant components", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Indietro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avanti" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oggi" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Calendario" })).toBeInTheDocument();
  });

  it("applies the writing direction to its wrapper", () => {
    render(Fixture, { props: { dir: "rtl" } });
    expect(document.querySelector(".ds-locale")).toHaveAttribute("dir", "rtl");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
