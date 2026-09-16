import { defineComponent, h, type PropType } from "vue";
import { Sidebar, type SidebarItem, type SidebarSection } from "../sidebar/Sidebar";

/** @deprecated Renamed to `SidebarItem`. Kept until the removal (ADR 0013). */
export type MenuEntry = SidebarItem;
/** @deprecated Renamed to `SidebarSection`. Kept until the removal (ADR 0013). */
export type MenuSection = SidebarSection;

export interface MenuProps {
  sections: MenuSection[];
  /** The active entry's value. */
  value?: string | null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  label?: string;
  onSelect?: (value: string) => void;
}

/**
 * @deprecated Renamed to `Sidebar` (ADR 0013): this name belongs to the
 * WAI-ARIA menu family, which Dropdown Menu, Context Menu and Menubar build on,
 * and which this component never used. Import `Sidebar` instead. Everything
 * here keeps working until the removal: the same props, the same slots, the
 * same behaviour, and `--ds-menu-*` still themes it.
 */
export const Menu = defineComponent({
  name: "Menu",
  props: {
    sections: { type: Array as PropType<MenuSection[]>, required: true },
    value: { type: String as PropType<string | null>, default: null },
    label: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h(
        Sidebar,
        {
          sections: props.sections,
          value: props.value,
          label: props.label,
          onSelect: props.onSelect,
        },
        slots,
      );
  },
});
