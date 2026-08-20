import { defineComponent, h, ref, type PropType, type VNode } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useCombobox, type ComboboxItem } from "./use-combobox";

/** A combobox option, optionally carrying a leading icon (an SVG path `d`). */
export interface ComboboxOption extends ComboboxItem {
  icon?: string;
}

export interface ComboboxProps {
  /** Accessible name for the control. */
  label: string;
  /** Options. Each may carry a leading `icon`; with the search hidden, the
   *  control mirrors the selected option's icon. */
  items: ComboboxOption[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string | null;
  /** Selected value. `null` for none. */
  value?: string | null;
  /**
   * With `searchable: false` the input becomes read-only and the list always
   * shows every option: a select-only combobox, the advanced Select (styled
   * popup, per-option icons) without the autocomplete.
   */
  searchable?: boolean;
  /**
   * Width behaviour: `fixed` (default) uses `--ds-combobox-width`, `wrap` fits
   * the longest option, `fill` takes 100% of the container.
   */
  width?: "wrap" | "fill" | "fixed";
  /** Input placeholder. Defaults to the catalog's "Search…". */
  placeholder?: string;
  disabled?: boolean;
  /** Clear button accessible name. Defaults to the catalog's "Clear". */
  clearLabel?: string;
  /** Text shown when no option matches. Defaults to the catalog's "No results". */
  emptyText?: string;
  /** Form field name; the selected option's value is submitted under it. */
  name?: string;
  onValueChange?: (value: string | null) => void;
  onInputValueChange?: (text: string) => void;
}

// The window in which a second press is treated as a synthesized duplicate.
const GHOST_CLICK_MS = 350;

/**
 * Combobox: a styled editable autocomplete (WAI-ARIA editable combobox), and
 * the design system's **advanced select**.
 *
 * Behaviour and accessibility come from the headless combobox
 * (`@design-system/core`); this adapter owns the DOM concerns: filtering, popup
 * positioning (flip/shift via Floating UI), close-on-outside-pointer and
 * keeping the active option in view. DOM focus stays on the input; the
 * highlighted option travels through `aria-activedescendant`.
 *
 * The selected value binds two ways: `v-model` (the idiomatic Vue form) or the
 * `value` prop plus `onValueChange`, matching the React adapter. The leading
 * glyph of the select-only mode goes in the `icon` slot.
 *
 * Use it over `Select` whenever options need to be *drawn* (icons, rich
 * content) or searched; see
 * `docs/adr/0003-native-select-advanced-combobox.md`. Themeable via
 * `--ds-combobox-*` (and the shared `--ds-select-*` listbox tokens).
 */
export const Combobox = defineComponent({
  name: "Combobox",
  props: {
    label: { type: String, required: true },
    items: { type: Array as PropType<ComboboxOption[]>, required: true },
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    searchable: { type: Boolean, default: true },
    width: { type: String as PropType<"wrap" | "fill" | "fixed">, default: "fixed" },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    clearLabel: { type: String, default: undefined },
    emptyText: { type: String, default: undefined },
    name: { type: String, default: undefined },
    onValueChange: {
      type: Function as PropType<(value: string | null) => void>,
      default: undefined,
    },
    onInputValueChange: {
      type: Function as PropType<(text: string) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: string | null) => value === null || typeof value === "string",
  },
  setup(props, { emit, slots }) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();

    const combobox = useCombobox(() => ({
      items: props.items,
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      disabled: props.disabled,
      // Select-only mode never filters: the read-only input is a trigger, so
      // the list must always show every option (keyboard opening included).
      filter: props.searchable ? undefined : (all: ComboboxItem[]) => all,
      onValueChange: (next: string | null) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
      onInputValueChange: props.onInputValueChange,
    }));

    const {
      api,
      items: visible,
      inputValue,
      value: selectedValue,
      open,
      inputRef,
      listboxRef,
      controlRef,
      floatingStyles,
      onInputChange,
      onInputPointerDown,
      openAll,
      setOpen,
    } = combobox;

    // The chevron toggles the list (showing all options when opening), so a
    // selected value can be changed without clearing it first. iOS Safari can
    // synthesize a duplicate "ghost" click after a tap; a click landing right
    // after a touch-driven one is ignored so the list doesn't open then
    // immediately close. Mouse and keyboard presses always count.
    const lastTouchToggle = ref(-Infinity);
    const chevronPointerType = ref("");
    const onChevronPointerdown = (event: PointerEvent) => {
      chevronPointerType.value = event.pointerType;
    };
    const toggle = (event: MouseEvent) => {
      if (event.timeStamp - lastTouchToggle.value < GHOST_CLICK_MS) return;
      if (chevronPointerType.value === "touch") lastTouchToggle.value = event.timeStamp;
      chevronPointerType.value = "";
      if (open.value) setOpen(false);
      else openAll();
    };

    return () => {
      const { t } = i18n.value;
      const resolvedPlaceholder = props.placeholder ?? t("combobox.placeholder");
      const resolvedClearLabel = props.clearLabel ?? t("combobox.clear");
      const resolvedEmptyText = props.emptyText ?? t("combobox.empty");

      const selected = props.items.find((item) => item.value === selectedValue.value);
      const hasIcons = props.items.some((item) => item.icon);
      const clearHidden = !inputValue.value || props.disabled;

      const checkGlyph = () => h("polyline", { points: "20 6 9 17 4 12" });

      // Options are keyed by value, so Vue reuses the same element across
      // highlight and selection changes. A node replaced mid-gesture (between
      // pointerdown and pointerup) would lose the press that selects it.
      const optionNodes: VNode[] =
        visible.value.length > 0
          ? visible.value.map((item) => {
              // The composable filters plain core items; the icon lives on the
              // prop list.
              const optionIcon = props.items.find((i) => i.value === item.value)?.icon;
              return h(
                "li",
                {
                  key: item.value,
                  ...api.value.getOptionProps(item.value),
                  class: "combobox__option",
                },
                [
                  h("span", { class: "combobox__check", "aria-hidden": "true" }, [
                    h(Icon, { size: "100%", strokeWidth: 2.5 }, { default: checkGlyph }),
                  ]),
                  hasIcons
                    ? h("span", { class: "combobox__option-icon", "aria-hidden": "true" }, [
                        optionIcon
                          ? h(
                              Icon,
                              { size: "100%" },
                              { default: () => h("path", { d: optionIcon }) },
                            )
                          : null,
                      ])
                    : null,
                  h("span", { class: "combobox__option-label" }, item.label ?? item.value),
                ],
              );
            })
          : [
              h(
                "li",
                {
                  key: "empty",
                  class: "combobox__empty",
                  role: "option",
                  "aria-selected": "false",
                  "aria-disabled": "true",
                },
                resolvedEmptyText,
              ),
            ];

      const listbox = h(
        "ul",
        {
          ...api.value.listboxProps,
          ref: listboxRef,
          class: "combobox__listbox",
          style: floatingStyles.value,
        },
        optionNodes,
      );

      const leadingGlyph = props.searchable
        ? h("span", { class: "combobox__search", "aria-hidden": "true" }, [
            h(
              Icon,
              { size: "100%" },
              {
                default: () => [
                  h("circle", { cx: "11", cy: "11", r: "8" }),
                  h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
                ],
              },
            ),
          ])
        : slots.icon || selected?.icon
          ? h("span", { class: "combobox__search", "aria-hidden": "true" }, [
              slots.icon
                ? slots.icon()
                : h(Icon, { size: "100%" }, { default: () => h("path", { d: selected?.icon }) }),
            ])
          : null;

      return h("div", { class: "combobox", "data-width": props.width }, [
        props.name
          ? h("input", { type: "hidden", name: props.name, value: selectedValue.value ?? "" })
          : null,

        h("label", { ...api.value.labelProps, class: "combobox__label" }, props.label),

        h(
          "div",
          {
            ref: controlRef,
            class: props.disabled
              ? "combobox__control combobox__control--disabled"
              : "combobox__control",
          },
          [
            leadingGlyph,

            h("input", {
              ...api.value.inputProps,
              ref: inputRef,
              class: props.searchable
                ? "combobox__input"
                : "combobox__input combobox__input--select-only",
              type: "text",
              placeholder: resolvedPlaceholder,
              readonly: !props.searchable,
              disabled: props.disabled,
              value: inputValue.value,
              onInput: onInputChange,
              onPointerdown: onInputPointerDown,
            }),

            // Invisible sizer: with width="wrap" the longest option (or the
            // placeholder) sets a stable control width.
            h("span", { class: "combobox__sizer", "aria-hidden": "true" }, [
              ...props.items.map((item) =>
                h("span", { key: item.value }, item.label ?? item.value),
              ),
              h("span", { key: "placeholder" }, resolvedPlaceholder),
            ]),

            // The clear button always occupies its slot (hidden when empty) so
            // the input width stays stable instead of jumping as text is typed.
            h(
              "button",
              {
                ...api.value.clearProps,
                class: clearHidden ? "combobox__clear combobox__clear--hidden" : "combobox__clear",
                "aria-label": resolvedClearLabel,
                tabindex: clearHidden ? -1 : 0,
                "aria-hidden": clearHidden ? "true" : undefined,
              },
              [
                h(
                  Icon,
                  { size: "100%" },
                  {
                    default: () => [
                      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
                    ],
                  },
                ),
              ],
            ),

            h(
              "button",
              {
                class: "combobox__chevron",
                type: "button",
                tabindex: -1,
                "aria-label": open.value ? t("combobox.hide") : t("combobox.show"),
                disabled: props.disabled,
                onMousedown: (event: MouseEvent) => event.preventDefault(),
                onPointerdown: onChevronPointerdown,
                onClick: toggle,
              },
              [
                h(
                  Icon,
                  { size: "100%" },
                  { default: () => h("polyline", { points: "6 9 12 15 18 9" }) },
                ),
              ],
            ),
          ],
        ),

        scopedTeleport(teleportDisabled.value, i18n.value, controlRef.value, [listbox]),
      ]);
    };
  },
});
