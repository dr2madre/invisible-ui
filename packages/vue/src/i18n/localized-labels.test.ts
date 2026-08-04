import { render, screen } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "./i18n";
import { Pagination } from "../pagination/Pagination";
import { RatingGroup } from "../rating-group/RatingGroup";
import { PinInput } from "../pin-input/PinInput";
import { Dialog } from "../dialog/Dialog";
import { Collapsible } from "../collapsible/Collapsible";
import { LoginForm } from "../login-form/LoginForm";
import { Carousel } from "../carousel/Carousel";
import { Combobox } from "../combobox/Combobox";

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

// The text a component shows when the consumer passes none: overridable by a
// prop, and now translated like everything else.
const Defaults = defineComponent({
  setup() {
    return () =>
      h(
        LocaleProvider,
        {
          locale: "it",
          messages: {
            "dialog.trigger": "Apri",
            "collapsible.toggle": "Mostra",
            "loginForm.heading": "Accedi",
          },
        },
        () => [
          h(Dialog, { title: "Condividi" }, () => "Contenuto"),
          h(Collapsible, null, () => "Dettagli"),
          h(LoginForm),
        ],
      );
  },
});

describe("built-in defaults", () => {
  it("come from the catalog", () => {
    render(Defaults);
    expect(screen.getByRole("button", { name: "Apri" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostra" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accedi" })).toBeInTheDocument();
  });
});

// Two names exist only for assistive technology, since the controls they sit
// on show a dot and a chevron: they used to be written into the components,
// with no prop to reach them.
const iconOnlyMessages = {
  "carousel.choose": "Scegli slide",
  "combobox.show": "Mostra opzioni",
  "combobox.hide": "Chiudi opzioni",
};

const IconOnly = defineComponent({
  setup() {
    return () =>
      h(LocaleProvider, { locale: "it", messages: iconOnlyMessages }, () => [
        h(Carousel, {
          items: [
            { title: "Uno", pastel: "#e5a1ac" },
            { title: "Due", pastel: "#b8a1e6" },
          ],
          label: "Destinazioni",
          showIndicators: true,
        }),
        h(Combobox, { label: "Frutto", items: [{ value: "mela", label: "Mela" }] }),
      ]);
  },
});

describe("names for controls with no visible text", () => {
  it("translate the carousel's slide chooser and the combobox chevron", () => {
    render(IconOnly);
    expect(screen.getByRole("group", { name: "Scegli slide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostra opzioni" })).toBeInTheDocument();
  });
});
