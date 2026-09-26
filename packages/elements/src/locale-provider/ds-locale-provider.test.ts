import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsAvatarGroup } from "../avatar-group/ds-avatar-group";
import type { DsLoginForm } from "../login-form/ds-login-form";
import type { DsSearchDialog } from "../search-dialog/ds-search-dialog";
import type { DsSidebar } from "../sidebar/ds-sidebar";
import type { DsTableSet } from "../table/ds-table-set";
import { peopleColumns, peopleRows } from "../table/table-set.fixture";
import { localeScope } from "../internal/i18n";
import type { DsLocaleProvider } from "./ds-locale-provider";

const IT = {
  "dialog.close": "Chiudi",
  "dialog.trigger": "Apri",
  "searchField.clear": "Cancella la ricerca",
  "searchField.submit": "Cerca",
  "searchDialog.trigger": "Cerca…",
  "searchDialog.label": "Cerca nel sito",
  "searchDialog.placeholder": "Scrivi per cercare…",
  "searchDialog.results": { one: "1 risultato", other: "{count} risultati" },
  "sidebar.collapse": "Comprimi la navigazione",
  "sidebar.expand": "Espandi la navigazione",
  "avatarGroup.more": { one: "{count} altro", other: "altri {count}" },
  "table.selectPage": "Seleziona tutte le righe visibili",
  "table.selectRow": "Seleziona {name}",
  "loginForm.heading": "Accedi",
  "loginForm.submit": "Accedi",
  "loginForm.email": "Email",
  "loginForm.password": "Password",
  "loginForm.divider": "oppure",
  "loginForm.provider": "Continua con {name}",
} as const;

/** A provider around `inner`, with the Italian overrides set before its children render. */
const mount = (inner: string, attributes = 'locale="it"') => {
  document.body.innerHTML = `<ds-locale-provider ${attributes}>${inner}</ds-locale-provider>`;
  const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
  provider.messages = IT;
  return provider;
};

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("lang");
});

describe("<ds-locale-provider>", () => {
  it("writes lang and a derived dir on itself", () => {
    const provider = mount("", 'locale="AR-eg"');
    expect(provider).toHaveAttribute("lang", "ar-EG");
    expect(provider).toHaveAttribute("dir", "rtl");
    expect(provider.locale).toBe("ar-EG");
    provider.locale = "it";
    expect(provider).toHaveAttribute("lang", "it");
    expect(provider).toHaveAttribute("dir", "ltr");
  });

  it("keeps an explicit dir over the one the locale implies", () => {
    const provider = mount("", 'locale="it" dir="rtl"');
    expect(provider).toHaveAttribute("dir", "rtl");
    provider.locale = "en";
    expect(provider).toHaveAttribute("dir", "rtl");
    provider.removeAttribute("dir");
    expect(provider).toHaveAttribute("dir", "ltr");
  });

  it("localizes the dialog's close button and trigger", async () => {
    const user = userEvent.setup();
    mount(`<ds-dialog heading="Impostazioni"><p>Corpo</p></ds-dialog>`);
    await user.click(screen.getByRole("button", { name: "Apri" }));
    const dialog = screen.getByRole("dialog", { name: "Impostazioni" });
    expect(within(dialog).getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("localizes the search field's clear and submit buttons", async () => {
    const user = userEvent.setup();
    mount(`<ds-search-field label="Cerca"></ds-search-field>`);
    await user.type(screen.getByRole("searchbox", { name: "Cerca" }), "gelato");
    expect(screen.getByRole("button", { name: "Cancella la ricerca" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerca" })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("localizes the search dialog, results count included", async () => {
    const user = userEvent.setup();
    mount(`<ds-search-dialog></ds-search-dialog>`);
    (document.querySelector("ds-search-dialog") as DsSearchDialog).items = [
      { value: "a", label: "Alfa" },
      { value: "b", label: "Beta" },
    ];
    await user.click(screen.getByRole("button", { name: "Cerca…" }));
    const input = screen.getByRole("combobox", { name: "Cerca nel sito" });
    expect(input).toHaveAttribute("placeholder", "Scrivi per cercare…");
    expect(screen.getByRole("status")).toHaveTextContent("2 risultati");
    await user.type(input, "Alf");
    expect(screen.getByRole("status")).toHaveTextContent("1 risultato");
  });

  it("localizes the sidebar's rail toggle", async () => {
    const user = userEvent.setup();
    mount(`<ds-sidebar rail-toggle></ds-sidebar>`);
    const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
    sidebar.sections = [{ items: [{ value: "home", label: "Home", icon: "M3 12l9-9 9 9" }] }];
    const toggle = screen.getByRole("button", { name: "Comprimi la navigazione" });
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Espandi la navigazione" })).toBeInTheDocument();
  });

  it("names the avatar group's overflow chip with the plural message", () => {
    mount(`<ds-avatar-group label="Team" max="1"></ds-avatar-group>`);
    const group = document.querySelector("ds-avatar-group") as DsAvatarGroup;
    group.items = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }];
    expect(screen.getByRole("img", { name: "1 altro" })).toHaveTextContent("+1");
    group.items = [...group.items, { name: "Alan Turing" }];
    expect(screen.getByRole("img", { name: "altri 2" })).toHaveTextContent("+2");
  });

  it("localizes the table set's selection checkboxes", () => {
    const provider = mount("");
    const set = document.createElement("ds-table-set") as DsTableSet;
    set.setAttribute("caption", "Persone");
    set.setAttribute("selection-mode", "multiple");
    set.columns = peopleColumns;
    set.rows = peopleRows;
    set.getRowLabel = (row) => String(row.name);
    provider.appendChild(set);
    expect(
      screen.getByRole("checkbox", { name: "Seleziona tutte le righe visibili" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleziona Ada" })).toBeInTheDocument();
  });

  it("localizes the login form", async () => {
    mount(`<ds-login-form></ds-login-form>`);
    const form = document.querySelector("ds-login-form") as DsLoginForm;
    form.providers = [{ id: "git", label: "GitHub" }];
    expect(screen.getByRole("heading", { name: "Accedi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continua con GitHub" })).toBeInTheDocument();
    expect(screen.getByText("oppure")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("name", "password");
    expect(screen.getByRole("button", { name: "Accedi" })).toHaveAttribute("type", "submit");
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("keeps an explicit label attribute over the catalog", async () => {
    const user = userEvent.setup();
    mount(
      `<ds-search-field label="Cerca" clear-label="Svuota" submit-label="Vai"></ds-search-field>`,
    );
    await user.type(screen.getByRole("searchbox"), "gelato");
    expect(screen.getByRole("button", { name: "Svuota" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vai" })).toBeInTheDocument();
  });

  it("renders the labels again when messages or locale change", () => {
    const provider = mount(`<ds-avatar-group label="Team" max="0"></ds-avatar-group>`);
    const group = document.querySelector("ds-avatar-group") as DsAvatarGroup;
    group.items = [{ name: "Ada Lovelace" }];
    expect(screen.getByRole("img", { name: "1 altro" })).toBeInTheDocument();

    provider.messages = { "avatarGroup.more": "+{count} persona" };
    expect(screen.getByRole("img", { name: "+1 persona" })).toBeInTheDocument();

    // Plural categories follow the locale: Arabic selects "zero" for 0.
    provider.messages = { "avatarGroup.more": { zero: "لا أحد", one: "واحد", other: "{count}" } };
    provider.locale = "ar";
    group.items = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }];
    group.setAttribute("max", "1");
    expect(screen.getByRole("img", { name: "واحد" })).toBeInTheDocument();

    provider.messages = {};
    expect(screen.getByRole("img", { name: "1 more" })).toBeInTheDocument();
  });

  it("lets the closest provider win", () => {
    document.body.innerHTML = `
      <ds-locale-provider id="outer" locale="it">
        <ds-tag id="outer-tag" removable>Uno</ds-tag>
        <ds-locale-provider id="inner" locale="fr">
          <ds-tag id="inner-tag" removable>Deux</ds-tag>
        </ds-locale-provider>
      </ds-locale-provider>`;
    const outer = document.getElementById("outer") as DsLocaleProvider;
    const inner = document.getElementById("inner") as DsLocaleProvider;
    outer.messages = { "tag.remove": "Rimuovi" };
    inner.messages = { "tag.remove": "Retirer" };
    const remove = (id: string) =>
      document.getElementById(id)!.querySelector("button")!.getAttribute("aria-label");
    expect(remove("outer-tag")).toBe("Rimuovi");
    expect(remove("inner-tag")).toBe("Retirer");
    expect(inner).toHaveAttribute("lang", "fr");

    // A provider without `locale` takes the language around it.
    inner.removeAttribute("locale");
    expect(inner).toHaveAttribute("lang", "it");
    outer.locale = "de";
    expect(inner).toHaveAttribute("lang", "de");
    outer.messages = { "tag.remove": "Entfernen" };
    expect(remove("outer-tag")).toBe("Entfernen");
    expect(remove("inner-tag")).toBe("Retirer");
  });

  it("reads the closest lang without a provider, then falls back to English", () => {
    document.documentElement.lang = "ar";
    document.body.innerHTML = `
      <div lang="ru-ru"><ds-tag id="ru" removable>Один</ds-tag></div>
      <ds-tag id="doc" removable>Uno</ds-tag>`;
    const ru = document.getElementById("ru")!;
    const doc = document.getElementById("doc")!;
    expect(localeScope(ru)).toEqual({ locale: "ru-RU", messages: {} });
    expect(localeScope(doc).locale).toBe("ar");
    // Without a provider there are no overrides: the English catalog.
    expect(within(ru).getByRole("button", { name: "Remove" })).toBeInTheDocument();
    document.documentElement.removeAttribute("lang");
    expect(localeScope(doc).locale).toBe("en");
  });

  it("gives a provider without locale the language of the page", () => {
    document.documentElement.lang = "ar";
    const provider = mount(`<ds-avatar-group label="Team" max="0"></ds-avatar-group>`, "");
    expect(provider).toHaveAttribute("lang", "ar");
    expect(provider).toHaveAttribute("dir", "rtl");
    provider.messages = { "avatarGroup.more": { zero: "لا أحد", two: "اثنان", other: "{count}" } };
    const group = document.querySelector("ds-avatar-group") as DsAvatarGroup;
    group.items = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }];
    expect(screen.getByRole("img", { name: "اثنان" })).toBeInTheDocument();
  });

  it("applies overrides set before the provider upgraded", () => {
    document.body.innerHTML = `<div id="host"></div>`;
    const provider = document.createElement("ds-locale-provider") as DsLocaleProvider;
    provider.setAttribute("locale", "it");
    provider.messages = { "tag.remove": "Rimuovi" };
    provider.innerHTML = `<ds-tag removable>Uno</ds-tag>`;
    document.getElementById("host")!.appendChild(provider);
    expect(screen.getByRole("button", { name: "Rimuovi" })).toBeInTheDocument();
  });
});
