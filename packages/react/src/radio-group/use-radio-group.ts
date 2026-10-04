import { radioGroup as core } from "@design-system/core";
import { useId, useMemo, useRef, type RefObject } from "react";
import { useCheckedDefaults, useResettable } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export type RadioGroupOrientation = core.Orientation;
export type RadioItem = core.RadioItem;

export interface UseRadioGroupOptions {
  /** Ordered list of items. */
  items: RadioItem[];
  /** Initial (uncontrolled) or current (controlled) selected value. */
  value?: string | null;
  disabled?: boolean;
  /** Layout and arrow-key axis. Defaults to `vertical`. */
  orientation?: RadioGroupOrientation;
  /** Shared form/group name; generated when omitted so the radios group. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
  /**
   * The element holding the radios. Given it, the radios carry the DOM default
   * a form reset restores, and the group puts its own value back when its form
   * is reset, silently (ADR 0012).
   */
  rootRef?: RefObject<HTMLElement | null>;
}

/**
 * Connect the headless radio group to React. The group is backed by native
 * `<input type="radio">` items sharing a `name`: the browser owns single
 * selection, roving tabindex, arrow-key navigation and form participation
 * (the selected value is submitted under the shared `name`); the hook owns the
 * controlled value. `getItemProps` carries the live `checked` too.
 */
export function useRadioGroup({
  items,
  value: valueProp = null,
  disabled = false,
  orientation = "vertical",
  name,
  onValueChange,
  rootRef,
}: UseRadioGroupOptions): core.RadioGroupApi {
  const generatedName = `ds-radio-group-${useId()}`;
  const ownRef = useRef<HTMLElement | null>(null);
  const anchor = rootRef ?? ownRef;
  const [value, setValue, defaultValue] = useResettable(
    valueProp,
    onValueChange as ((value: string | null) => void) | undefined,
    anchor,
  );
  useCheckedDefaults(anchor, (item) => item === defaultValue, [defaultValue, items]);

  return useMemo(() => {
    const api = core.connect({
      state: { value, items, orientation, disabled },
      setValue: (next) => {
        if (next !== value) setValue(next);
      },
      name: name ?? generatedName,
      normalize: normalizeProps,
    });
    return {
      ...api,
      getItemProps: (item) => ({ ...api.getItemProps(item), checked: value === item }),
    };
  }, [value, items, orientation, disabled, name, generatedName, setValue]);
}
