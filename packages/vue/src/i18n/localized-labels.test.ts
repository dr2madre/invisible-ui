import { render, screen } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "./i18n";
import { Pagination } from "../pagination/Pagination";
import { RatingGroup } from "../rating-group/RatingGroup";
import { PinInput } from "../pin-input/PinInput";

// Pagination controls, rating stars and the PIN cells used to carry English
// written into the components, so an app switching locale kept announcing it.

const messages = {
  "pagination.previous": "Pagina precedente",
  "pagination.next": "Pagina successiva",
  "pagination.page": "Vai a pagina {page}",
  "rating.star": "{count} stella",
  "rating.stars": "{count} stelle",
  "pinInput.cell": "Carattere {index} di {length}",
};

const Fixture = defineComponent({
  setup() {
    return () =>
      h(LocaleProvider, { locale: "it", messages }, () => [
        h(Pagination, { page: 1, pageCount: 3 }),
        h(RatingGroup, { label: "Voto", max: 3 }),
        h(PinInput, { label: "Codice", length: 4 }),
      ]);
  },
});

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
