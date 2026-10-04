import { accordion as core } from "@design-system/core";
import { useId, useMemo } from "react";
import { sameSet, useControllable } from "../internal/controllable";
import { normalizeProps } from "../normalize";

export type AccordionType = core.AccordionType;
export type AccordionItem = core.AccordionItem;

export interface UseAccordionOptions {
  /** Ordered list of items. */
  items: AccordionItem[];
  /** Initial (uncontrolled) or current (controlled) expanded values. */
  value?: string[];
  /** `single` (default): one open at a time. `multiple`: many. */
  type?: AccordionType;
  /** For `single`: allow collapsing the open item. Defaults to `true`. */
  collapsible?: boolean;
  disabled?: boolean;
  /** Arrow-key axis for moving between headers. Defaults to `vertical`. */
  orientation?: core.Orientation;
  /** Called whenever the user changes the expanded set. */
  onValueChange?: (value: string[]) => void;
}

const NONE: string[] = [];

/**
 * Connect the headless accordion (WAI-ARIA accordion pattern) to React: header
 * buttons that show and hide their regions, one at a time or several, with
 * arrow-key movement between headers. `value` is a controllable mirror
 * (ADR 0011) compared by content, so a fresh array with the same entries
 * changes nothing.
 */
export function useAccordion({
  items,
  value: valueProp = NONE,
  type = "single",
  collapsible = true,
  disabled = false,
  orientation = "vertical",
  onValueChange,
}: UseAccordionOptions): core.AccordionApi {
  const id = `ds-accordion-${useId()}`;
  const [value, setValue] = useControllable(valueProp, onValueChange, sameSet);
  return useMemo(
    () =>
      core.connect({
        state: { value, items, type, collapsible, disabled, orientation, id },
        setValue,
        focus: (target) => document.getElementById(core.triggerId(id, target))?.focus(),
        normalize: normalizeProps,
      }),
    [value, items, type, collapsible, disabled, orientation, id, setValue],
  );
}
