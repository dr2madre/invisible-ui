import type { radioGroup as core } from "@design-system/core";
import { useMemo, type RefObject } from "react";
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
  /** The element holding the star radios; see `useRadioGroup`. */
  rootRef?: RefObject<HTMLElement | null>;
}

export interface UseRatingGroup {
  /** The stars (1..max). */
  items: RatingItem[];
  /** The connected radio-group API driving the stars. */
  api: core.RadioGroupApi;
  /** The selected rating, or `null`. */
  value: number | null;
}

/**
 * Connect a headless rating group to React. A rating is a horizontal
 * single-select over native radios, so it is a thin layer over
 * {@link useRadioGroup}: the browser owns selection, roving tabindex and arrow
 * keys, and this hook exposes the rating as a number.
 */
export function useRatingGroup({
  max = 5,
  value = null,
  disabled,
  name,
  onValueChange,
  rootRef,
}: UseRatingGroupOptions = {}): UseRatingGroup {
  const items = useMemo(
    () => Array.from({ length: max }, (_, i) => ({ value: String(i + 1), position: i + 1 })),
    [max],
  );
  const api = useRadioGroup({
    items,
    value: value == null ? null : String(value),
    disabled,
    orientation: "horizontal",
    name,
    onValueChange: onValueChange && ((next) => onValueChange(Number(next))),
    rootRef,
  });
  return { items, api, value: api.value == null ? null : Number(api.value) };
}
