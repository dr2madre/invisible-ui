import type { radioGroup as core } from "@design-system/core";
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { useRadioGroup } from "../radio-group/use-radio-group";

/** A single star, with its 1-based position. */
export interface RatingItem {
  value: string;
  position: number;
}

export interface UseRatingGroupOptions {
  /** Number of stars. Defaults to `5`. */
  max?: number;
  /** Selected rating (`1..max`), or `null`. */
  value?: number | null;
  disabled?: boolean;
  /** Form field name; the rating is submitted under it. */
  name?: string;
  /** Called whenever the rating changes. */
  onValueChange?: (value: number) => void;
}

export interface UseRatingGroup {
  /** The stars (1..max). */
  items: ComputedRef<RatingItem[]>;
  /** Reactive connected radio-group API driving the stars. */
  api: ComputedRef<core.RadioGroupApi>;
  /** The selected rating, or `null`. */
  value: ComputedRef<number | null>;
  /** Imperatively set the rating. */
  setValue: (value: number) => void;
}

/**
 * Connect a headless rating group to Vue. A rating is a horizontal
 * single-select over native radios, so it is a thin layer over
 * {@link useRadioGroup}: the browser owns selection, roving tabindex and
 * arrow keys, and this composable exposes the rating as a number. The star
 * rendering lives in the styled layer.
 */
export function useRatingGroup(
  options: MaybeRefOrGetter<UseRatingGroupOptions> = {},
): UseRatingGroup {
  const resolved = computed(() => toValue(options));
  const items = computed<RatingItem[]>(() =>
    Array.from({ length: resolved.value.max ?? 5 }, (_, i) => ({
      value: String(i + 1),
      position: i + 1,
    })),
  );

  const api = useRadioGroup(() => ({
    items: items.value.map((item) => ({ value: item.value })),
    value: resolved.value.value != null ? String(resolved.value.value) : null,
    disabled: resolved.value.disabled,
    orientation: "horizontal",
    name: resolved.value.name,
    onValueChange: (next: string) => resolved.value.onValueChange?.(Number(next)),
  }));

  return {
    items,
    api,
    value: computed(() => (api.value.value != null ? Number(api.value.value) : null)),
    setValue: (value: number) => api.value.setValue(String(value)),
  };
}
