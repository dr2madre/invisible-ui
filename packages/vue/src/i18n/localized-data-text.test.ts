import { render, screen } from "@testing-library/vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { AvatarGroup } from "../avatar-group/AvatarGroup";
import { Calendar } from "../calendar/Calendar";
import { Carousel } from "../carousel/Carousel";
import { CodeBlock } from "../code-block/CodeBlock";
import { LoginForm } from "../login-form/LoginForm";
import { TableSet } from "../table/TableSet";
import { LocaleProvider } from "./i18n";

// These components wrote some of their text in English although the catalog
// has a key for it, so an app that translated the catalog still heard English.

// A catalog override a product would give.
const messages = {
  "avatarGroup.more": { one: "altro {count}", other: "altri {count}" },
  "codeBlock.copyText": "Copia",
  "codeBlock.copiedText": "Copiato",
  "codeBlock.label": "Codice",
  "codeBlock.labelLanguage": "Codice: {language}",
  "codeBlock.sample": "Esempio di codice",
  "codeBlock.sampleLanguage": "Esempio di codice, {language}",
  "carousel.goTo": "Vai alla slide {index}",
  "carousel.slide": "{index} di {count}",
  "carousel.roleDescription": "carosello",
  "carousel.slideRoleDescription": "diapositiva",
  "table.view": "Vista",
  "table.viewTable": "Tabella",
  "table.viewCards": "Schede",
  "table.results": { one: "{count} risultato", other: "{count} risultati" },
  "calendar.events": { one: "{count} evento", other: "{count} eventi" },
  "calendar.rangeStart": "inizio intervallo",
  "calendar.rangeEnd": "fine intervallo",
  "loginForm.email": "Indirizzo e-mail",
  "loginForm.emailPlaceholder": "tu@esempio.it",
  "loginForm.password": "Parola chiave",
  "loginForm.divider": "oppure",
  "loginForm.provider": "Continua con {name}",
};

const people = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
  { id: 3, name: "Alan" },
];

const rows = ref(people);
const filtersActive = ref(false);

const Fixture = defineComponent({
  setup() {
    return () =>
      h(LocaleProvider, { locale: "it", messages }, () => [
        h(AvatarGroup, {
          label: "Squadra",
          max: 2,
          items: [{ name: "Ada" }, { name: "Grace" }, { name: "Alan" }, { name: "Edsger" }],
        }),
        h(CodeBlock, { language: "ts", code: "const a = 1;" }),
        h(Carousel, { label: "Mete", items: [{ title: "Uno" }, { title: "Due" }] }),
        h(TableSet, {
          columns: [{ key: "name", header: "Nome", sortable: true }],
          rows: rows.value,
          filtersActive: filtersActive.value,
          totalRowCount: 3,
          allowViewToggle: true,
          title: "Persone",
          caption: "Persone",
        }),
        h(Calendar, {
          mode: "range",
          rangeStart: "2026-06-10",
          rangeEnd: "2026-06-14",
          focusedDate: "2026-06-10",
          events: [{ date: "2026-06-10", label: "Riunione" }],
          locale: "it",
        }),
        h(LoginForm, { providers: [{ id: "g", label: "Google" }] }),
      ]);
  },
});

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
    rows.value = people;
    filtersActive.value = false;
    render(Fixture);
    const region = () => document.querySelector(".table-view > .table-view__sr");
    filtersActive.value = true;
    rows.value = people.slice(0, 1);
    await nextTick();
    expect(region()).toHaveTextContent("1 risultato");
    rows.value = people.slice(0, 2);
    await nextTick();
    expect(region()).toHaveTextContent("2 risultati");
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
