import { derived, type Readable } from "svelte/store";
import { createRadioGroup } from "../radio-group/create-radio-group";

export interface RatingGroupContext {
  /** Number of stars. Defaults to `5`. */
  max?: number;
  /** Selected rating (`1..max`), or `null`. */
  value?: number | null;
  disabled?: boolean;
  /** Form field name — the rating is submitted under it. */
  name?: string;
  /** Called whenever the rating changes. */
  onValueChange?: (value: number) => void;
}

/** A single star, with its 1-based position. */
export interface RatingItem {
  value: string;
  position: number;
}

export interface CreateRatingGroup {
  /** Number of stars. */
  max: number;
  /** The stars (1..max). */
  items: RatingItem[];
  /** The selected rating (or `null`). */
  value: Readable<number | null>;
  /** Imperatively set the rating. */
  setValue: (value: number) => void;
  /** Whether the group is disabled. */
  disabled: boolean;
  /** Shared form/group name applied to every star radio. */
  name: string;
}

/**
 * Create a headless rating group. It is a thin layer over the native radio
 * group ({@link createRadioGroup}) — a horizontal single-select where the
 * browser owns selection, roving tabindex and arrow keys — exposing the rating
 * as a number. The star rendering lives in the styled layer.
 */
export function createRatingGroup(context: RatingGroupContext = {}): CreateRatingGroup {
  const max = context.max ?? 5;
  const items: RatingItem[] = Array.from({ length: max }, (_, i) => ({
    value: String(i + 1),
    position: i + 1,
  }));

  const radio = createRadioGroup({
    items: items.map((i) => ({ value: i.value })),
    value: context.value != null ? String(context.value) : null,
    disabled: context.disabled,
    orientation: "horizontal",
    name: context.name,
    onValueChange: (v) => context.onValueChange?.(Number(v)),
  });

  return {
    max,
    items,
    value: derived(radio.value, ($v) => ($v != null ? Number($v) : null)),
    setValue: (value: number) => radio.setValue(String(value)),
    disabled: context.disabled ?? false,
    name: radio.name,
  };
}
