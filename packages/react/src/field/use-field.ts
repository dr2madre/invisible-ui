import { field as core } from "@design-system/core";
import { useId } from "react";
import { normalizeProps } from "../normalize";

export interface UseFieldOptions {
  /** Base id the part ids derive from. Generated when omitted. */
  id?: string;
  required?: boolean;
  /** Marks the control invalid (`aria-invalid`). */
  invalid?: boolean;
  disabled?: boolean;
  /** A description is rendered: the control is described by it. */
  hasDescription?: boolean;
  /** An error message is rendered: the control is described by it. */
  hasError?: boolean;
}

/**
 * Connect the headless field to React. A field ties a label, a control, a
 * description and an error message together: the ids, `aria-describedby`,
 * `aria-invalid` and `aria-required` all come from `@design-system/core`.
 * Spread `labelProps`, `controlProps`, `descriptionProps` and `errorProps`
 * onto your own parts. Only the base id is kept between renders; every flag
 * is read from the options.
 */
export function useField({ id, ...flags }: UseFieldOptions = {}): core.FieldApi {
  const generatedId = `ds-field-${useId()}`;
  return core.connect({
    state: core.initialState({ ...flags, id: id ?? generatedId }),
    normalize: normalizeProps,
  });
}
