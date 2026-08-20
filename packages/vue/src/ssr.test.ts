// @vitest-environment node
import { renderToString } from "@vue/server-renderer";
import { createSSRApp, h, type Component } from "vue";
import { describe, expect, it } from "vitest";
import * as adapter from "./index";

type Props = Record<string, unknown>;

const requiredProps: Record<string, Props> = {
  Accordion: { items: [] },
  AlertDialog: { title: "Alert", description: "Alert description" },
  Avatar: { name: "Ada Lovelace" },
  AvatarGroup: { items: [], label: "People" },
  Breadcrumb: { items: [] },
  ButtonGroup: { label: "Actions" },
  Carousel: { items: [], label: "Featured items" },
  Checkbox: { label: "Accept" },
  CheckboxGroup: { items: [], label: "Options" },
  Combobox: { items: [], label: "Search" },
  NumberField: { label: "Amount" },
  ConfirmDialog: { title: "Confirm" },
  ContextMenu: { items: [] },
  Dialog: { title: "Dialog" },
  DropdownMenu: { items: [], label: "Menu" },
  EmptyState: { title: "No results" },
  ErrorState: { title: "Something went wrong" },
  Field: { label: "Field" },
  InlineNotification: { title: "Notice", description: "Notification description" },
  Menubar: { label: "Application", menus: [] },
  MultiSelect: { label: "Skills", items: [] },
  Menu: { sections: [] },
  Meter: { label: "Storage" },
  NavigationMenu: { label: "Primary", items: [] },
  NotificationRegion: { notifier: adapter.createNotifier() },
  Pagination: { pageCount: 1 },
  PinInput: { label: "Verification code" },
  Progress: { label: "Loading" },
  PromptDialog: { title: "Rename", label: "Name" },
  Radio: { value: "one", name: "choice" },
  RadioGroup: { items: [], label: "Choice" },
  RatingGroup: { label: "Rating" },
  SearchDialog: { items: [] },
  SegmentedControl: { items: [], label: "View" },
  Select: { items: [], label: "Option" },
  SheetDialog: { title: "Details" },
  Slider: { label: "Volume" },
  Stepper: { steps: [] },
  Switch: { label: "Notifications" },
  Table: { columns: [], rows: [] },
  Tabs: { items: [], label: "Sections" },
  Textarea: { label: "Message" },
  TextField: { label: "Name" },
  Toolbar: { label: "Formatting" },
  Tooltip: { text: "More information" },
  TreeView: { nodes: [], label: "Files" },
};

const isPublicComponent = (value: unknown): value is Component =>
  typeof value === "object" && value !== null && "setup" in value;

const components = Object.entries(adapter).filter((entry): entry is [string, Component] =>
  isPublicComponent(entry[1]),
);

describe("Vue adapter SSR", () => {
  it("discovers every public component export", () => {
    // The 75 catalog components plus Icon and LocaleProvider. This count makes
    // a new public component fail loudly until it joins the SSR guarantee.
    expect(components).toHaveLength(78);
  });

  for (const [name, component] of components) {
    it(`server-renders ${name} without a DOM`, async () => {
      const app = createSSRApp({
        render: () =>
          h(component, requiredProps[name] ?? {}, {
            default: () => name,
          }),
      });

      const html = await renderToString(app);
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(0);
    });
  }
});

describe("Vue adapter SSR — i18n determinism", () => {
  it("renders two concurrent locale scopes independently of the host locale", async () => {
    const { renderToString } = await import("@vue/server-renderer");
    const { createSSRApp, h } = await import("vue");
    const [it_, en_] = await Promise.all(
      ["it-IT", "en"].map((locale) =>
        renderToString(
          createSSRApp({
            render: () =>
              h(
                adapter.LocaleProvider,
                { locale },
                {
                  default: () => [
                    h(adapter.Calendar, { value: "2026-01-15", focusedDate: "2026-01-15" }),
                  ],
                },
              ),
          }),
        ),
      ),
    );
    expect(it_).toContain("gennaio 2026");
    expect(it_).toContain('lang="it-IT"');
    expect(en_).toContain("January 2026");
    // The Italian render did not leak into the English one.
    expect(en_).not.toContain("gennaio");
  });

  it("renders the number field's localized value deterministically on the server", async () => {
    const { renderToString } = await import("@vue/server-renderer");
    const { createSSRApp, h } = await import("vue");
    const html = await renderToString(
      createSSRApp({
        render: () => h(adapter.NumberField, { label: "Amount", value: 12345.5, locale: "it-IT" }),
      }),
    );
    expect(html).toContain('value="12.345,5"');
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('inputmode="decimal"');
  });

  it("derives dir from the locale on the server too", async () => {
    const { renderToString } = await import("@vue/server-renderer");
    const { createSSRApp, h } = await import("vue");
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(adapter.LocaleProvider, { locale: "ar-EG" }, { default: () => [h("span", "x")] }),
      }),
    );
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar-EG"');
  });
});
