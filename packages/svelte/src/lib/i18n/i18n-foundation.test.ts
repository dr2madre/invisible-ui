import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import Fixture from "./i18n-foundation.fixture.svelte";

const wrapper = () => document.querySelector(".ds-locale") as HTMLElement;

describe("Svelte i18n foundation", () => {
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
    const { unmount } = render(Fixture, { props: { locale: "IT-it" } });
    expect(wrapper()).toHaveAttribute("lang", "it-IT");
    unmount();
    render(Fixture, { props: { locale: "not a tag" } });
    expect(document.querySelector(".ds-locale")).toHaveAttribute("lang", "en");
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
    // The outer scope keeps its overrides; the nested one falls back to the
    // catalog under its own locale.
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
    expect(screen.getByRole("radio", { name: "3 звезды" })).toBeInTheDocument();
  });

  it("updates formatting on a post-mount locale change without losing focus or drafts", async () => {
    const { rerender } = render(Fixture, { props: { locale: "en" } });
    expect(document.body.textContent).toContain("January 2026");
    const input = screen.getByRole("textbox", { name: "Notes" }) as HTMLInputElement;
    input.focus();
    await fireEvent.input(input, { target: { value: "draft" } });
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

  it("carries the scope's lang and dir onto portaled overlay roots", async () => {
    render(Fixture, { props: { locale: "ar-EG" } });
    const comboboxInput = screen.getByRole("combobox", { name: "Fruit" });
    await fireEvent.keyDown(comboboxInput, { key: "ArrowDown" });
    const listbox = document.querySelector(".combobox__listbox") as HTMLElement;
    // The listbox is portaled to <body>, outside the provider wrapper.
    expect(listbox.closest(".ds-locale")).toBeNull();
    expect(listbox).toHaveAttribute("dir", "rtl");
    expect(listbox).toHaveAttribute("lang", "ar-EG");
  });
});
