import { elementDirection, type Dir } from "../i18n/locale";

/**
 * The computed reading direction of the element a key event reached, so a
 * `dir` set anywhere above the control counts, with or without a locale
 * provider. Without a DOM, or without a current target, it is `"ltr"`.
 */
export function directionOf(event: Event): Dir {
  return elementDirection(event.currentTarget as Element | null) ?? "ltr";
}
