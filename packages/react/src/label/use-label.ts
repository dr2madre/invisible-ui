import { label as core } from "@design-system/core";
import { normalizeProps } from "../normalize";

export interface UseLabelOptions {
  /** Id of the control the label names. */
  htmlFor?: string;
  /** Id of the label itself, for `aria-labelledby` on the control. */
  id?: string;
}

/**
 * Connect the headless label to React. The core owns the `htmlFor` and `id`
 * association and stops a double click on the label from selecting its
 * text; spread `rootProps` onto a `<label>`.
 */
export function useLabel({ htmlFor, id }: UseLabelOptions = {}): core.LabelApi {
  return core.connect({
    state: core.initialState({ for: htmlFor, id }),
    normalize: normalizeProps,
  });
}
