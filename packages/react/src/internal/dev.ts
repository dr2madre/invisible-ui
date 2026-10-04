/**
 * True in development builds. Read through a call marked pure: a bare
 * property read at the top level stays in every bundle, even one that never
 * asks for it.
 */
export const DEV: boolean = /* @__PURE__ */ (() => import.meta.env?.DEV === true)();

/**
 * Consumer misuse is an error in development and a documented, deterministic
 * fallback in production. Callers invoke this and then run the fallback path,
 * which the development throw never reaches.
 */
export function fail(message: string): void {
  if (DEV) throw new Error(`[ds] ${message}`);
}
