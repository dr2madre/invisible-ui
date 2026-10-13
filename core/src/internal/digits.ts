/**
 * Map Arabic-Indic (U+0660–0669) and Extended Arabic-Indic, or Persian,
 * (U+06F0–06F9) digits to ASCII digits. Keyboards type them whatever the
 * page's locale, so every numeric input folds them. Both blocks start at a
 * code point ending in 0, so the low four bits are the digit. Everything else
 * passes through untouched.
 */
export const foldArabicDigits = (text: string): string =>
  text.replace(/[٠-٩۰-۹]/g, (char) => String(char.charCodeAt(0) & 15));
