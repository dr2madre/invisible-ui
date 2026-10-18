/**
 * Data Grid: a grid of focusable cells with in-place number editing
 * (docs/editable-grid-spec.md). The module is pure and DOM-free, so its key
 * table ports to Dart as data:
 *
 * - `gridKeyCommand` is the key table of both modes; `nextEditable`,
 *   `initialActive`, `acceptsCharacter` and `matchesShortcut` are its parts.
 * - `clampActive` and `resolveActive` keep the active cell across data
 *   changes.
 * - `sumValues` and `gridTotals` derive the totals, skipping `null` and
 *   rounding to the decimals of their terms.
 * - `cellLabel`, `detailsLabel` and `errorAnnouncement` compose the spoken
 *   text from the message catalog.
 *
 * The shared vectors in `__vectors__/` are read by these tests and by the
 * Flutter adapter.
 */
export * from "./types";
export * from "./keyboard";
export * from "./active";
export * from "./totals";
export * from "./label";
