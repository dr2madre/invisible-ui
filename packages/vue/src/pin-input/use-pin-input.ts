import { pinInput as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";
import { useI18n } from "../i18n/i18n";

export type PinInputType = core.PinInputType;
export type PinInputApi = core.PinInputApi;
export type PinInputState = core.PinInputState;

export interface UsePinInputOptions {
  /** Initial (uncontrolled) or current (controlled) value; spread across the cells. */
  value?: string;
  /** Number of cells. Defaults to `6`. */
  length?: number;
  /** Allowed characters. Defaults to `numeric`. */
  type?: PinInputType;
  /** Render cells masked. */
  mask?: boolean;
  disabled?: boolean;
  /** Accessible name for a cell, by zero-based index. Defaults to the catalog. */
  cellLabel?: (index: number, length: number) => string;
  /** Called whenever the combined value changes. */
  onValueChange?: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
}

export interface UsePinInput {
  /** Reactive connected API; spread `api.value.rootProps` / `getInputProps(i)`. */
  api: ComputedRef<PinInputApi>;
  /** Per-cell values. */
  values: ComputedRef<string[]>;
  /** The combined value. */
  value: ComputedRef<string>;
  /** Replace the per-cell values. */
  setValues: (values: string[]) => void;
  /** Template ref for the container; scopes the focus movement between cells. */
  rootRef: Ref<HTMLElement | null>;
}

/**
 * Connect the headless PIN input (OTP / verification code) to Vue. Behaviour
 * and accessibility (per-cell entry, advance/backspace, arrows, paste
 * distribution, character filtering) live in `@design-system/core`; this
 * composable owns the per-cell values, derives the connected props with
 * `computed(connect)`, moves DOM focus inside the container (`rootRef`), and
 * fires `onComplete` once every cell is filled.
 */
export function usePinInput(options: MaybeRefOrGetter<UsePinInputOptions> = {}): UsePinInput {
  const resolved = computed(() => toValue(options));
  const i18n = useI18n();
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState(resolved.value);
  const values = ref<string[]>(seed.values);

  // The per-cell array is the state's own field: a blank cell in the middle of
  // the code has to survive, and the joined value would close that gap.
  const state = computed<PinInputState>(() => ({
    values: values.value,
    length: resolved.value.length ?? seed.length,
    type: resolved.value.type ?? seed.type,
    mask: resolved.value.mask ?? seed.mask,
    disabled: resolved.value.disabled ?? seed.disabled,
    id: seed.id,
  }));

  // Mirror an externally controlled value, and re-spread the current one when
  // the cell count changes.
  watch(
    () => resolved.value.value,
    (next) => {
      if (next != null) values.value = core.splitValue(next, state.value.length);
    },
  );
  watch(
    () => resolved.value.length,
    () => {
      values.value = core.splitValue(values.value.join(""), state.value.length);
    },
  );

  const setValues = (next: string[]) => {
    values.value = next;
    const value = next.join("");
    resolved.value.onValueChange?.(value);
    if (core.isComplete({ ...state.value, values: next })) resolved.value.onComplete?.(value);
  };

  const rootRef = ref<HTMLElement | null>(null);
  const focus = (index: number) => {
    const el = rootRef.value
      ? Array.from(rootRef.value.querySelectorAll<HTMLElement>("[data-index]")).find(
          (node) => node.dataset.index === String(index),
        )
      : null;
    el?.focus();
  };

  const api = computed(() =>
    core.connect({
      state: state.value,
      setValues,
      focus,
      cellLabel:
        resolved.value.cellLabel ??
        ((index, length) => i18n.value.t("pinInput.cell", { index: index + 1, length })),
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    values: computed(() => api.value.values),
    value: computed(() => api.value.value),
    setValues,
    rootRef,
  };
}
