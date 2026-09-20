import { textField as core } from "@design-system/core";
import { useCallback, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useFormDefault, useFormReset } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export interface UseTextFieldOptions {
  /** Initial or current value. */
  value?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  hasDescription?: boolean;
  hasSuccess?: boolean;
  /** Called once after a user edit has been committed locally. */
  onValueChange?: (value: string) => void;
  /** Native input carrying the form default and reset subscription. */
  controlRef?: RefObject<HTMLInputElement | null>;
}

/** Connect the shared text-field state and accessibility wiring to React. */
export function useTextField({
  value = "",
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  hasDescription = false,
  hasSuccess = false,
  onValueChange,
  controlRef,
}: UseTextFieldOptions = {}): core.TextFieldApi {
  const generatedId = useId();
  const [current, setCurrent] = useState(value);
  const [lastProp, setLastProp] = useState(value);
  const [defaultValue, setDefaultValue] = useState(value);

  if (value !== lastProp) {
    setLastProp(value);
    if (value !== current) setDefaultValue(value);
    setCurrent(value);
  }

  const ownRef = useRef<HTMLInputElement | null>(null);
  const anchor = controlRef ?? ownRef;
  useFormDefault(anchor, (node) => {
    node.defaultValue = defaultValue;
  });
  useFormReset(anchor, () => setCurrent(defaultValue));

  const setValue = useCallback(
    (next: string) => {
      setCurrent(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  return useMemo(
    () =>
      core.connect({
        state: core.initialState({
          id: `ds-text-field-${generatedId}`,
          value: current,
          disabled,
          readOnly,
          required,
          invalid,
          hasDescription,
          hasSuccess,
        }),
        setValue,
        normalize: normalizeProps,
      }),
    [
      generatedId,
      current,
      disabled,
      readOnly,
      required,
      invalid,
      hasDescription,
      hasSuccess,
      setValue,
    ],
  );
}
