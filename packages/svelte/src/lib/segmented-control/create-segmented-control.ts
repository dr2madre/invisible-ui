import {
  createRadioGroup,
  type CreateRadioGroup,
  type RadioGroupContext,
  type RadioItem,
} from "../radio-group/create-radio-group";

export type SegmentItem = RadioItem;

/**
 * Options for a segmented control. Identical to a radio group's, except the
 * layout defaults to `horizontal`.
 */
export type SegmentedControlContext = RadioGroupContext;

export type CreateSegmentedControl = CreateRadioGroup;

/**
 * Create a headless segmented control. A segmented control is a single-select
 * group, so it shares the WAI-ARIA radio group semantics (roving tabindex,
 * arrow navigation) and only differs by defaulting to a horizontal layout and
 * being styled as a segmented bar. `itemAction(value)` binds each segment.
 */
export function createSegmentedControl(context: SegmentedControlContext): CreateSegmentedControl {
  return createRadioGroup({ orientation: "horizontal", ...context });
}
