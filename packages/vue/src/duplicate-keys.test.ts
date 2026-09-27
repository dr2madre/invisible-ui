import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarGroup } from "./avatar-group/AvatarGroup";
import { Calendar } from "./calendar/Calendar";
import { DropdownMenu } from "./dropdown-menu/DropdownMenu";
import { EmptyState } from "./empty-state/EmptyState";
import { ErrorState } from "./error-state/ErrorState";
import { InlineNotification } from "./inline-notification/InlineNotification";
import { NavigationMenu } from "./navigation-menu/NavigationMenu";

// Lists keyed by consumer text (a label, a name, an href) broke as soon as two
// entries shared it: Vue reuses the wrong node on update. Each case starts
// from one entry and moves to a list with a repeated entry in the middle, the
// update path where Vue compares keys.

const duplicateKeyWarnings = (warn: ReturnType<typeof vi.spyOn>) =>
  warn.mock.calls
    .flat()
    .map(String)
    .filter((message: string) => /duplicate keys/i.test(message));

let warn: ReturnType<typeof vi.spyOn>;
const watchWarnings = () => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
};

afterEach(() => vi.restoreAllMocks());

describe("Vue lists keep repeated entries apart", () => {
  it("AvatarGroup: two people with the same name", async () => {
    watchWarnings();
    const { rerender } = render(AvatarGroup, {
      props: { label: "Team", items: [{ name: "Solo" }] },
    });
    await rerender({
      label: "Team",
      items: [{ name: "First" }, { name: "Sam Lee" }, { name: "Sam Lee" }, { name: "Last" }],
    });
    expect(duplicateKeyWarnings(warn)).toEqual([]);
    expect(screen.getAllByRole("img", { name: "Sam Lee" })).toHaveLength(2);
  });

  it.each(["month", "day"] as const)(
    "Calendar (%s view): two events with the same label on a day",
    async (view) => {
      watchWarnings();
      const props = { value: "2026-06-10", focusedDate: "2026-06-10", locale: "en-US", view };
      const { rerender } = render(Calendar, {
        props: { ...props, maxDots: 4, events: [{ date: "2026-06-10", label: "Solo" }] },
      });
      await rerender({
        ...props,
        maxDots: 4,
        events: [
          { date: "2026-06-10", label: "First" },
          { date: "2026-06-10", label: "Standup" },
          { date: "2026-06-10", label: "Standup" },
          { date: "2026-06-10", label: "Last" },
        ],
      });
      expect(duplicateKeyWarnings(warn)).toEqual([]);
    },
  );

  it("DropdownMenu: two groups with the same label", async () => {
    watchWarnings();
    const group = (label: string, value: string) => ({
      type: "group" as const,
      label,
      items: [{ value, label: value }],
    });
    const { rerender } = render(DropdownMenu, {
      props: { label: "Actions", items: [group("Solo", "a")] },
    });
    await rerender({
      label: "Actions",
      items: [group("First", "b"), group("Files", "c"), group("Files", "d"), group("Last", "e")],
    });
    expect(duplicateKeyWarnings(warn)).toEqual([]);
  });

  it.each([
    ["EmptyState", EmptyState, { title: "No results" }],
    ["ErrorState", ErrorState, { title: "Something went wrong" }],
  ] as const)("%s: two actions with the same label", async (_name, component, base) => {
    watchWarnings();
    const { rerender } = render(component as never, {
      props: { ...base, actions: [{ label: "Solo" }] } as never,
    });
    await rerender({
      ...base,
      actions: [
        { label: "First" },
        { label: "Open", href: "#a" },
        { label: "Open", href: "#b" },
        { label: "Last" },
      ],
    });
    expect(duplicateKeyWarnings(warn)).toEqual([]);
  });

  it("InlineNotification: two actions with the same label", async () => {
    watchWarnings();
    const base = { title: "Notice", description: "Something happened" };
    const { rerender } = render(InlineNotification, {
      props: { ...base, actions: [{ label: "Solo" }] },
    });
    await rerender({
      ...base,
      actions: [{ label: "First" }, { label: "Undo" }, { label: "Undo" }, { label: "Last" }],
    });
    expect(duplicateKeyWarnings(warn)).toEqual([]);
  });

  it("NavigationMenu: two links to the same place", async () => {
    watchWarnings();
    const user = userEvent.setup();
    const menu = (links: { label: string; href: string }[]) => [
      { value: "products", label: "Products", links },
    ];
    const { rerender } = render(NavigationMenu, {
      props: { label: "Main", items: menu([{ label: "Solo", href: "#solo" }]) },
    });
    await user.click(screen.getByRole("button", { name: "Products" }));
    await rerender({
      label: "Main",
      items: menu([
        { label: "First", href: "#first" },
        { label: "Docs", href: "#docs" },
        { label: "Guides", href: "#docs" },
        { label: "Last", href: "#last" },
      ]),
    });
    expect(duplicateKeyWarnings(warn)).toEqual([]);
    expect(screen.getByRole("link", { name: "Guides" })).toBeInTheDocument();
  });
});
