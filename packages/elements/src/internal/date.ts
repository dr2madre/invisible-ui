const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** An ISO `YYYY-MM-DD` date, or `null` for anything else (the empty string included). */
export const asDate = (value: string | null | undefined): string | null =>
  value && ISO_DATE.test(value) ? value : null;

/** Midnight local time, so `Intl` shows the same calendar day as the ISO date. */
export const dt = (iso: string): Date => new Date(`${iso}T00:00:00`);
