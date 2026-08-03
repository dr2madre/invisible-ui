import type { radioGroup as core } from "@design-system/core";
import { toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { useRadioGroup, type UseRadioGroupOptions } from "../radio-group/use-radio-group";

export type SegmentItem = core.RadioItem;

/**
 * Options for a segmented control. Identical to a radio group's, except the
 * layout defaults to `horizontal`.
 */
export type UseSegmentedControlOptions = UseRadioGroupOptions;

/**
 * Connect a headless segmented control to Vue. A segmented control is a
 * single-select group, so it shares the WAI-ARIA radio group semantics (roving
 * tabindex, arrow navigation) and only differs by defaulting to a horizontal
 * layout and being styled as a segmented bar.
 */
export function useSegmentedControl(
  options: MaybeRefOrGetter<UseSegmentedControlOptions>,
): ComputedRef<core.RadioGroupApi> {
  return useRadioGroup(() => ({ orientation: "horizontal", ...toValue(options) }));
}
