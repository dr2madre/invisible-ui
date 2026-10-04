import { checkboxGroup as core } from "@design-system/core";
import { useMemo, useRef, type RefObject } from "react";
import { useCheckedDefaults, useResettable } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export type CheckboxGroupItem = core.CheckboxGroupItem;

export interface UseCheckboxGroupOptions {
  items: CheckboxGroupItem[];
  /** Initial (uncontrolled) or current (controlled) selected values. */
  value?: string[];
  disabled?: boolean;
  /** Shared form field name applied to every item. */
  name?: string;
  /** Called whenever the selected values change. */
  onValueChange?: (value: string[]) => void;
  /**
   * The `<fieldset>` holding the boxes. Given it, the boxes carry the DOM
   * default a form reset restores, and the group puts its own selection back
   * when its form is reset, silently (ADR 0012).
   */
  rootRef?: RefObject<HTMLFieldSetElement | null>;
}

const NONE: string[] = [];

/**
 * The same selection, whatever order each side keeps it in: the group stores
 * toggle order, a parent may store its own, and a re-ordered echo is still a
 * give-back.
 */
const sameValues = (a: string[], b: string[]) =>
  a.length === b.length && a.every((entry) => b.includes(entry));

/**
 * Connect the headless checkbox group to React. A native `<fieldset>` exposes
 * the group role and each item is a native `<input type="checkbox">`, so the
 * browser owns Space activation, focus and form participation (every checked
 * item submits its value under the shared `name`); the hook owns the
 * selection. `getItemProps` carries the live `checked` too.
 */
export function useCheckboxGroup({
  items,
  value: valueProp = NONE,
  disabled = false,
  name,
  onValueChange,
  rootRef,
}: UseCheckboxGroupOptions): core.CheckboxGroupApi {
  const ownRef = useRef<HTMLFieldSetElement | null>(null);
  const anchor = rootRef ?? ownRef;
  const [value, setValue, defaultValue] = useResettable(
    valueProp,
    onValueChange,
    anchor,
    sameValues,
  );
  useCheckedDefaults(anchor, (item) => defaultValue.includes(item), [defaultValue, items]);

  return useMemo(() => {
    const api = core.connect({
      state: { value, items, disabled },
      setValue,
      name,
      normalize: normalizeProps,
    });
    return {
      ...api,
      getItemProps: (item) => ({ ...api.getItemProps(item), checked: api.isChecked(item) }),
    };
  }, [value, items, disabled, name, setValue]);
}
