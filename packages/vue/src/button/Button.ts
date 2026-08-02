import { defineComponent, h, type PropType } from "vue";
import { HazardGlyph, Icon, PlusGlyph } from "../icon/Icon";
import { useButton, type ButtonVariant } from "./use-button";

export interface ButtonProps {
  /**
   * Semantic variant, surfaced as `data-variant`:
   * `default` (baseline) · `primary` (the action that moves the flow forward) ·
   * `secondary` (alternative emphasized action) · `ghost` (low emphasis) ·
   * `danger` (destructive: shows a hazard icon so meaning never rests on
   * colour alone, WCAG 1.4.1).
   */
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  /** Called when the button is activated. */
  onPress?: (event: Event) => void;
  /** Show a leading icon. Defaults on for `danger` (the hazard cue). */
  leftIcon?: boolean;
  /** Show a trailing icon. */
  rightIcon?: boolean;
  /**
   * Icon-only button: square, no text. Pass a single icon as the default slot
   * and an `ariaLabel`.
   */
  iconOnly?: boolean;
  /**
   * Accessible name. Required for icon-only buttons; for buttons with visible
   * text the text is the name and this is unnecessary.
   */
  ariaLabel?: string;
}

/**
 * Button: the styled, batteries-included button. Behaviour and accessibility
 * come from the headless Button (`@design-system/core`); this layer adds the
 * semantic variants and icon affordances. The label is the default slot; the
 * `left` and `right` slots replace the built-in leading/trailing glyphs.
 *
 * **Composition.** Extra attributes fall through to the underlying `<button>`,
 * so an overlay (Dialog, Popover, …) can use the Button as its trigger by
 * binding its `triggerProps`, the Vue counterpart of the React adapter's prop
 * spreading. Vue merges a fallthrough `@click` with the button's own press
 * handler, so both run.
 *
 * Colours and sizing are themeable via `--ds-button-*`.
 */
export const Button = defineComponent({
  name: "Button",
  props: {
    variant: { type: String as PropType<ButtonVariant>, default: "default" },
    disabled: { type: Boolean, default: false },
    type: { type: String as PropType<"button" | "submit" | "reset">, default: "button" },
    onPress: { type: Function as PropType<(event: Event) => void>, default: undefined },
    leftIcon: { type: Boolean, default: undefined },
    rightIcon: { type: Boolean, default: false },
    iconOnly: { type: Boolean, default: false },
    ariaLabel: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const api = useButton(() => ({
      variant: props.variant,
      disabled: props.disabled,
      type: props.type,
      onPress: props.onPress,
    }));

    return () => {
      // Icon-only buttons carry their single glyph in the default slot, so they
      // never get the automatic leading/trailing icon (which would double up
      // with it).
      const showLeft =
        !props.iconOnly && ((props.leftIcon ?? props.variant === "danger") || slots.left != null);
      const showRight = !props.iconOnly && (props.rightIcon || slots.right != null);

      if (import.meta.env?.DEV && !props.ariaLabel && (props.iconOnly || slots.default == null)) {
        console.warn(
          "[ds] Button has no accessible name: provide visible text (the default slot) or an `ariaLabel` for icon-only buttons.",
        );
      }

      const glyph = () => (props.variant === "danger" ? HazardGlyph() : PlusGlyph());

      return h(
        "button",
        {
          ...api.value.rootProps,
          class: props.iconOnly ? "button button--icon-only" : "button",
          "aria-label": props.ariaLabel ?? (attrs["aria-label"] as string | undefined),
        },
        [
          showLeft
            ? h("span", { class: "button__icon" }, [
                slots.left ? slots.left() : h(Icon, null, { default: glyph }),
              ])
            : null,
          slots.default?.(),
          showRight
            ? h("span", { class: "button__icon" }, [
                slots.right ? slots.right() : h(Icon, null, { default: () => PlusGlyph() }),
              ])
            : null,
        ],
      );
    };
  },
});
