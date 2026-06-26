import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { ButtonState, ButtonVariant } from "./types";

/** The public, framework-agnostic API for a connected Button. */
export interface ButtonApi {
  /** Whether the button is disabled. */
  disabled: boolean;
  /** Semantic variant. */
  variant: ButtonVariant;
  /** Props for the root element. */
  rootProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: ButtonState;
  /** Called when the button is activated (click, or Enter/Space when emulated). */
  onPress?: (event: Event) => void;
  /** Native `<button>` type. Defaults to `"button"` to avoid accidental submits. */
  type?: "button" | "submit" | "reset";
  /**
   * Whether the consumer renders a native `<button>` (default). Set `false`
   * when rendering another element (e.g. `<a>`, `<div>`): the button role,
   * focusability and Enter/Space activation are then emulated.
   */
  nativeButton?: boolean;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect Button state to prop getters following the WAI-ARIA button pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/button/).
 */
export function connect({
  state,
  onPress,
  type = "button",
  nativeButton = true,
  normalize = identityNormalize,
}: ConnectOptions): ButtonApi {
  const { disabled, variant } = state;

  const press = (event: Event) => {
    if (disabled) return;
    onPress?.(event);
  };

  if (nativeButton) {
    return {
      disabled,
      variant,
      rootProps: normalize({
        type,
        disabled: disabled || undefined,
        "data-disabled": disabled ? "" : undefined,
        "data-variant": variant,
        onClick: press,
      }),
    };
  }

  // Non-native element: emulate a button.
  return {
    disabled,
    variant,
    rootProps: normalize({
      role: "button",
      "data-variant": variant,
      tabindex: disabled ? undefined : 0,
      "aria-disabled": disabled || undefined,
      "data-disabled": disabled ? "" : undefined,
      onClick: (event: Event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        press(event);
      },
      onKeyDown: (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          press(event);
        }
      },
    }),
  };
}
