/**
 * An ISO date, or `null` for "nothing selected". The empty string a
 * text-shaped model starts with is not a date: a date formatter given it
 * throws while rendering.
 */
export const asDate = (iso: string | null | undefined): string | null => (iso ? iso : null);

/** Midnight local time, so `Intl` shows the same calendar day as the ISO date. */
export const localDate = (iso: string): Date => new Date(`${iso}T00:00:00`);
