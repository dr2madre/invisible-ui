import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./localized-data-text.fixture.svelte";

// These components wrote some of their text in English although the catalog
// has a key for it, so an app that translated the catalog still heard English.

describe("data and text components take their texts from the catalog", () => {
  it("names the overflow chip of an avatar group", () => {
    render(Fixture);
    expect(screen.getByRole("img", { name: "altri 2" })).toBeInTheDocument();
  });

  it("names the code block, its scroller and the copy text", () => {
    const { container } = render(Fixture);
    expect(screen.getByRole("group", { name: "Codice: ts" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Esempio di codice, ts" })).toBeInTheDocument();
    expect(container.querySelector(".code-block__copy")).toHaveTextContent("Copia");
  });

  it("names the carousel, its slides and its dots", () => {
    const { container } = render(Fixture);
    const carousel = container.querySelector(".carousel")!;
    expect(carousel).toHaveAttribute("aria-roledescription", "carosello");
    const slides = [...carousel.querySelectorAll(".carousel__slide")];
    expect(slides.map((slide) => slide.getAttribute("aria-label"))).toEqual(["1 di 2", "2 di 2"]);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "diapositiva");
    expect(screen.getByRole("button", { name: "Vai alla slide 2" })).toBeInTheDocument();
  });

  it("names the view switch of a table set", () => {
    render(Fixture);
    expect(screen.getByRole("radiogroup", { name: "Vista" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Tabella" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Schede" })).toBeInTheDocument();
  });

  it("announces the result count in the catalog's words", async () => {
    const { rerender } = render(Fixture);
    await rerender({ filtersActive: true, rows: [{ id: 1, name: "Ada" }] });
    expect(document.querySelector(".table-view > .table-view__sr")).toHaveTextContent(
      "1 risultato",
    );
    await rerender({
      rows: [
        { id: 1, name: "Ada" },
        { id: 2, name: "Grace" },
      ],
    });
    expect(document.querySelector(".table-view > .table-view__sr")).toHaveTextContent(
      "2 risultati",
    );
  });

  it("names the events and the ends of a range on a calendar day", () => {
    render(Fixture);
    const first = document.querySelector<HTMLElement>('[data-date="2026-06-10"]')!;
    expect(first.getAttribute("aria-label")).toMatch(/, 1 evento, inizio intervallo$/);
    const last = document.querySelector<HTMLElement>('[data-date="2026-06-14"]')!;
    expect(last.getAttribute("aria-label")).toMatch(/, fine intervallo$/);
  });

  it("labels the login form fields, divider and provider", () => {
    render(Fixture);
    expect(screen.getByRole("textbox", { name: "Indirizzo e-mail" })).toHaveAttribute(
      "placeholder",
      "tu@esempio.it",
    );
    expect(screen.getByLabelText("Parola chiave")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Continua con Google" })).toBeInTheDocument();
    expect(screen.getByText("oppure")).toBeInTheDocument();
  });
});
