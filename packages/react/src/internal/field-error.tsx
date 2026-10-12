import { useId, type ReactNode } from "react";
import { HazardGlyph, Icon } from "../icon/Icon";

/**
 * The error message of a control that has no text field around it, shown the
 * way the text field shows its own: an alert with the hazard glyph. Returns
 * the id the controls name in `aria-describedby`, undefined while no error
 * shows, and the message to render after the control.
 */
export function useFieldError(error?: string): [string | undefined, ReactNode] {
  const id = `ds-${useId()}-error`;
  return error
    ? [
        id,
        <p id={id} className="field__error field__message" role="alert">
          <span className="field__msg-icon" aria-hidden="true">
            <Icon size="1em">
              <HazardGlyph />
            </Icon>
          </span>
          {error}
        </p>,
      ]
    : [undefined, null];
}
