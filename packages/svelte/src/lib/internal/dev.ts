/** True in development builds. */
export const DEV: boolean = import.meta.env?.DEV === true;

/**
 * Consumer misuse is an error in development and a documented, deterministic
 * fallback in production. Callers invoke this and then run the fallback path,
 * which the development throw never reaches.
 */
export function fail(message: string): void {
  if (DEV) throw new Error(`[ds] ${message}`);
}
