import type { ReactNode } from "react";
import { useLabel } from "./use-label";

export interface LabelProps {
  /** Id of the control this labels. */
  htmlFor?: string;
  /** Show a required marker (`*`), hidden from assistive tech, after the text. */
  required?: boolean;
  /** The label text. */
  children?: ReactNode;
}

/**
 * Label: a form label tied to a control through `htmlFor`. The association
 * and the guard against selecting the text on a double click come from the
 * headless label (`@design-system/core`); this layer adds the type styles and
 * an optional required marker.
 *
 * Themeable via `--ds-label-*`.
 */
export function Label({ htmlFor, required = false, children }: LabelProps) {
  const { rootProps } = useLabel({ htmlFor });
  return (
    <label {...rootProps} className="label">
      {children}
      {required ? (
        <span className="label__required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
