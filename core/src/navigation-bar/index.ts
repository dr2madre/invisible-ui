/**
 * Navigation Bar: primary navigation between a few top-level sections
 * (docs/navigation-bar-spec.md). The bar holds no state: the current
 * destination is the application's `value`.
 *
 * - `connect` gives the landmark, list, destination and reason props, the
 *   arrow keys and `select`.
 * - `move` is the arrow-key rule as a pure function.
 * - `describeDestination` and `badgeAnnouncements` compose the spoken text
 *   from the message catalog; `holdAnnouncements` keeps the latest one per
 *   destination while a modal dialog is open.
 *
 * The shared vectors in `__vectors__/` are read by these tests and by the
 * Flutter adapter.
 */
export * from "./types";
export * from "./connect";
export * from "./text";
