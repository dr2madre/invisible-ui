import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { Menubar } from "./Menubar";
import type { MenubarMenu } from "./use-menubar";

// The menu list used to be read once at setup, so a menubar built from data
// that arrives or changes later kept showing the first list until it remounted.

const file: MenubarMenu = {
  value: "file",
  label: "File",
  items: [{ value: "new", label: "New" }],
};
const edit: MenubarMenu = {
  value: "edit",
  label: "Edit",
  items: [{ value: "undo", label: "Undo" }],
};
const view: MenubarMenu = {
  value: "view",
  label: "View",
  items: [{ value: "zoom", label: "Zoom in" }],
};

const triggers = () => screen.getAllByRole("menuitem").map((node) => node.textContent?.trim());

describe("Vue Menubar (reactive menu list)", () => {
  it("follows the list as it grows, shrinks and reorders", async () => {
    const menus = ref<MenubarMenu[]>([file, edit]);
    const Reactive = defineComponent({
      setup: () => () => h(Menubar, { label: "Main", menus: menus.value }),
    });
    render(Reactive);
    expect(triggers()).toEqual(["File", "Edit"]);

    menus.value = [file, edit, view];
    await nextTick();
    expect(triggers()).toEqual(["File", "Edit", "View"]);

    menus.value = [view, file];
    await nextTick();
    expect(triggers()).toEqual(["View", "File"]);
  });

  it("opens a menu that arrived after the first render", async () => {
    const user = userEvent.setup();
    const menus = ref<MenubarMenu[]>([file]);
    const Reactive = defineComponent({
      setup: () => () => h(Menubar, { label: "Main", menus: menus.value }),
    });
    render(Reactive);

    menus.value = [file, view];
    await nextTick();

    await user.click(screen.getByRole("menuitem", { name: "View" }));
    expect(screen.getByRole("menuitem", { name: "Zoom in" })).toBeInTheDocument();
  });
});
