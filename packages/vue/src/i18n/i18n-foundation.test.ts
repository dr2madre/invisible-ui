import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider, type Dir } from "./i18n";
import type { Messages } from "./messages";
import { Calendar } from "../calendar/Calendar";
import { Combobox } from "../combobox/Combobox";
import { RatingGroup } from "../rating-group/RatingGroup";
import { TextField } from "../text-field/TextField";

const Fixture = defineComponent({
  props: {
    locale: { type: String, default: "en" },
    dir: { type: String, default: undefined },
    messages: { type: Object, default: () => ({}) },
    calendarLocale: { type: String, default: undefined },
    onValueChange: { type: Function, default: undefined },
    nestedLocale: { type: String, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        LocaleProvider,
        {
          locale: props.locale,
          dir: props.dir as Dir | undefined,
          messages: props.messages as Messages,
        },
        {
          default: () => [
            h(Calendar, {
              value: "2026-01-15",
              focusedDate: "2026-01-15",
              locale: props.calendarLocale,
              onValueChange: props.onValueChange as ((v: string | null) => void) | undefined,
            }),
            h(RatingGroup, { label: "Rating", value: 1, max: 3 }),
            h(TextField, { label: "Notes" }),
            h(Combobox, { label: "Fruit", items: [{ value: "apple", label: "Apple" }] }),
            props.nestedLocale
              ? h(
                  LocaleProvider,
                  { locale: props.nestedLocale },
                  {
                    default: () => [
                      h("span", { "data-testid": "nested-probe" }, [
                        h(RatingGroup, { label: "Nested rating", value: 2, max: 3 }),
                      ]),
                    ],
                  },
                )
              : null,
          ],
        },
      );
  },
});

const wrapper = () => document.querySelector("div[lang]") as HTMLElement;

describe("Vue i18n foundation", () => {
  it("drives component formatting from the provider locale", () => {
    render(Fixture, { props: { locale: "it-IT" } });
    expect(document.body.textContent).toContain("gennaio 2026");
  });

  it("keeps the explicit component locale above the provider", () => {
    render(Fixture, { props: { locale: "it-IT", calendarLocale: "de-DE" } });
    expect(document.body.textContent).toContain("Januar 2026");
    expect(document.body.textContent).not.toContain("gennaio 2026");
  });

  it("outputs lang and a locale-derived dir on the wrapper", () => {
    render(Fixture, { props: { locale: "ar-EG" } });
    expect(wrapper()).toHaveAttribute("lang", "ar-EG");
    expect(wrapper()).toHaveAttribute("dir", "rtl");
  });

  it("lets an explicit dir win over the derived one", () => {
    render(Fixture, { props: { locale: "ar-EG", dir: "ltr" } });
    expect(wrapper()).toHaveAttribute("dir", "ltr");
  });

  it("canonicalizes the provider locale and falls back deterministically", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = render(Fixture, { props: { locale: "IT-it" } });
    expect(wrapper()).toHaveAttribute("lang", "it-IT");
    first.unmount();
    render(Fixture, { props: { locale: "not a tag" } });
    expect(document.querySelector("div[lang]")).toHaveAttribute("lang", "en");
    spy.mockRestore();
  });

  it("scopes a nested provider to its subtree", () => {
    render(Fixture, {
      props: {
        locale: "en",
        messages: { "rating.stars": { one: "{count} star!", other: "{count} stars!" } },
        nestedLocale: "it-IT",
      },
    });
    const nested = screen.getByTestId("nested-probe");
    expect(nested.querySelector("[aria-label='2 stars']")).not.toBeNull();
  });

  it("selects plural categories with the provider locale", () => {
    render(Fixture, {
      props: {
        locale: "ru",
        messages: {
          "rating.stars": { one: "{count} звезда", few: "{count} звезды", other: "{count} звёзд" },
        },
      },
    });
    expect(screen.getByRole("radio", { name: "1 звезда" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2 звезды" })).toBeInTheDocument();
  });

  it("updates formatting on a post-mount locale change without losing focus or drafts", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { locale: "en" } });
    expect(document.body.textContent).toContain("January 2026");
    const input = screen.getByRole("textbox", { name: "Notes" }) as HTMLInputElement;
    input.focus();
    await user.type(input, "draft");
    await rerender({ locale: "it-IT" });
    expect(document.body.textContent).toContain("gennaio 2026");
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("draft");
    expect(wrapper()).toHaveAttribute("lang", "it-IT");
  });

  it("emits no component callback on a provider locale change", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Fixture, { props: { locale: "en", onValueChange } });
    await rerender({ locale: "it-IT" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("carries the scope's lang and dir onto teleported overlay roots", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { locale: "ar-EG" } });
    const comboboxInput = screen.getByRole("combobox", { name: "Fruit" });
    comboboxInput.focus();
    await user.keyboard("{ArrowDown}");
    const listbox = document.querySelector(".combobox__listbox") as HTMLElement;
    const scope = listbox.closest("[dir]") as HTMLElement;
    // The listbox teleports to <body>; its scope wrapper carries the locale.
    expect(scope).toHaveAttribute("dir", "rtl");
    expect(scope).toHaveAttribute("lang", "ar-EG");
    expect(scope.closest("div[lang='ar-EG'][class]")).toBeNull();
  });
});
