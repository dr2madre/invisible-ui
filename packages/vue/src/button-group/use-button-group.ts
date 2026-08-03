import { buttonGroup as core } from "@design-system/core";
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type ButtonGroupApi = core.ButtonGroupApi;
export type ButtonGroupState = core.ButtonGroupState;
export type ButtonGroupOrientation = core.Orientation;

export interface UseButtonGroupOptions {
  /** Accessible name for the group (recommended for `role="group"`). */
  label?: string;
  /** Layout orientation, exposed as a styling hook. Defaults to `horizontal`. */
  orientation?: ButtonGroupOrientation;
}

/**
 * Connect the headless button group to Vue. The group is a labelled
 * `role="group"` container that orients its buttons; it holds no selection, so
 * there are no per-item props and each button stays an independent tab stop.
 * The state is derived straight from the options, so a changed `label` or
 * `orientation` flows through on the next render.
 */
export function useButtonGroup(
  options: MaybeRefOrGetter<UseButtonGroupOptions> = {},
): ComputedRef<ButtonGroupApi> {
  return computed(() =>
    core.connect({ state: core.initialState(toValue(options)), normalize: normalizeProps }),
  );
}
