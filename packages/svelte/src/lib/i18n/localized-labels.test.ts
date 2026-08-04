import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./localized-labels.fixture.svelte";
import DefaultsFixture from "./defaults.fixture.svelte";

// Pagination controls, rating stars and the PIN cells used to carry English
// written into the markup, so an app switching locale kept announcing it.

describe("localized labels", () => {
  it("translate the pagination controls and pages", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Pagina precedente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina successiva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vai a pagina 2" })).toBeInTheDocument();
  });

  it("translate the rating stars, singular and plural", () => {
    render(Fixture);
    expect(screen.getByRole("radio", { name: "1 stella" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "3 stelle" })).toBeInTheDocument();
  });

  it("translate the pin cells", () => {
    const { container } = render(Fixture);
    const cells = [...container.querySelectorAll(".pin-input__cell")];
    expect(cells.map((cell) => cell.getAttribute("aria-label"))).toEqual([
      "Carattere 1 di 4",
      "Carattere 2 di 4",
      "Carattere 3 di 4",
      "Carattere 4 di 4",
    ]);
  });
});

// The text a component shows when the consumer passes none: overridable by a
// prop, and now translated like everything else.
describe("built-in defaults", () => {
  it("come from the catalog", () => {
    render(DefaultsFixture);
    expect(screen.getByRole("button", { name: "Apri" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostra" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accedi" })).toBeInTheDocument();
  });
});
