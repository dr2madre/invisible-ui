import { derived, writable, type Readable } from "svelte/store";
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
  max: Readable<number>;
  /** The stars (1..max). */
  items: Readable<RatingItem[]>;
  /** The selected rating (or `null`). */
  value: Readable<number | null>;
  /** Imperatively set the rating. */
  setValue: (value: number) => void;
  /** Reflect a controlled `value` prop without reporting a change. */
  syncValue: (value: number | null) => void;
  /** Reflect a controlled `max` prop: the stars follow it, reporting nothing. */
  syncMax: (max: number) => void;
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
  const max = writable(context.max ?? 5);
  const starsFor = (count: number): RatingItem[] =>
    Array.from({ length: count }, (_, i) => ({ value: String(i + 1), position: i + 1 }));

  // The radio group's own item list is read only by its connected API, which
  // the native radios do not use, so the stars are the one list kept live.
  const radio = createRadioGroup({
    items: starsFor(context.max ?? 5).map((i) => ({ value: i.value })),
    value: context.value != null ? String(context.value) : null,
    disabled: context.disabled,
    orientation: "horizontal",
    name: context.name,
    onValueChange: (v) => context.onValueChange?.(Number(v)),
  });

  return {
    max: { subscribe: max.subscribe },
    items: derived(max, starsFor),
    value: derived(radio.value, ($v) => ($v != null ? Number($v) : null)),
    setValue: (value: number) => radio.setValue(String(value)),
    syncValue: (value: number | null) => radio.syncValue(value != null ? String(value) : null),
    syncMax: (next: number) => max.set(next),
    disabled: context.disabled ?? false,
    name: radio.name,
  };
}
