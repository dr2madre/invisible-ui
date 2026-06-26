import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { controlId, descriptionId, errorId, labelId } from "./state";
import type { FieldState } from "./types";

/** The resolved ids for the parts of a field. */
export interface FieldIds {
  label: string;
  control: string;
  description: string;
  error: string;
}

/** The public, framework-agnostic API for a connected field. */
export interface FieldApi {
  /** Resolved ids for each part. */
  ids: FieldIds;
  /** Props for the field container (styling hooks). */
  rootProps: ElementProps;
  /** Props for the label element (`<label>`). */
  labelProps: ElementProps;
  /** Props to spread onto the control (id + ARIA wiring). */
  controlProps: ElementProps;
  /** Props for the description element. */
  descriptionProps: ElementProps;
  /** Props for the error message element. */
  errorProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: FieldState;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect field state to prop getters. A field links a label, control,
 * description and error message: the label points at the control (`for`/`id`),
 * and the control references whichever of the description/error are present via
 * a single `aria-describedby`, plus `aria-invalid` / `aria-required`.
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): FieldApi {
  const { id, required, invalid, disabled, hasDescription, hasError } = state;

  const describedby =
    [hasDescription ? descriptionId(id) : null, hasError ? errorId(id) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    ids: {
      label: labelId(id),
      control: controlId(id),
      description: descriptionId(id),
      error: errorId(id),
    },
    rootProps: normalize({
      "data-invalid": invalid ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      "data-required": required ? "" : undefined,
    }),
    labelProps: normalize({
      id: labelId(id),
      for: controlId(id),
    }),
    controlProps: normalize({
      id: controlId(id),
      "aria-describedby": describedby,
      "aria-invalid": invalid || undefined,
      "aria-required": required || undefined,
      disabled: disabled || undefined,
    }),
    descriptionProps: normalize({
      id: descriptionId(id),
    }),
    errorProps: normalize({
      id: errorId(id),
      "aria-live": "polite",
    }),
  };
}
