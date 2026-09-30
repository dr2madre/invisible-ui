import { defineComponent, h, mergeProps, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { HazardGlyph, Icon, PlusGlyph } from "../icon/Icon";
import { useCopyFeedback } from "../internal/copy-feedback";
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
  /** Text copied to the clipboard when the button is activated. */
  copy?: string;
  /** The confirmation shown after a copy. Defaults to the catalog's "Copied". */
  copiedLabel?: string;
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
 * `copy` makes it a copy button (ADR 0016): activating it writes that text to
 * the clipboard and, when that works, shows "Copied" beside the button for two
 * seconds. That text is a polite live region, so it is also announced; the
 * button keeps its name and focus. `copiedLabel` replaces the confirmation
 * text. A refused clipboard shows nothing. With `copy` set the component
 * renders the button and the confirmation side by side; extra attributes
 * still go to the `<button>`.
 *
 * Colours and sizing are themeable via `--ds-button-*`.
 */
export const Button = defineComponent({
  name: "Button",
  // Attributes go to the <button> even when the copy confirmation sits beside it.
  inheritAttrs: false,
  props: {
    variant: { type: String as PropType<ButtonVariant>, default: "default" },
    disabled: { type: Boolean, default: false },
    type: { type: String as PropType<"button" | "submit" | "reset">, default: "button" },
    onPress: { type: Function as PropType<(event: Event) => void>, default: undefined },
    leftIcon: { type: Boolean, default: undefined },
    rightIcon: { type: Boolean, default: false },
    iconOnly: { type: Boolean, default: false },
    ariaLabel: { type: String, default: undefined },
    copy: { type: String, default: undefined },
    copiedLabel: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const i18n = useI18n();
    const feedback = useCopyFeedback();

    const api = useButton(() => ({
      variant: props.variant,
      disabled: props.disabled,
      type: props.type,
      onPress: (event: Event) => {
        props.onPress?.(event);
        // Read at the press, so a `copy` value changed later is the one copied.
        if (props.copy != null) void feedback.copy(props.copy);
      },
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

      const button = h(
        "button",
        mergeProps(
          {
            ...api.value.rootProps,
            class: props.iconOnly ? "button button--icon-only" : "button",
            "aria-label": props.ariaLabel ?? (attrs["aria-label"] as string | undefined),
          },
          attrs,
        ),
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
      if (props.copy == null) return button;

      // The confirmation lives beside the button, never inside it: text inside
      // would change the button's name. It exists while `copy` is set, so the
      // live region is in the page before it speaks.
      const confirmation = feedback.copied.value
        ? (props.copiedLabel ?? i18n.value.t("button.copied"))
        : "";
      return [button, h("span", { class: "button__status", role: "status" }, confirmation)];
    };
  },
});
