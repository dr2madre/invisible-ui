/**
 * Toggle Group: the keyboard rule shared by every adapter. The group holds no
 * state; each toggle inside keeps its own pressed value.
 *
 * - With three or more toggles the group is one tab stop. The arrow keys move
 *   focus between the enabled toggles, wrapping at the ends; left and right
 *   follow the reading direction in a horizontal group, up and down move in a
 *   vertical one; Home and End jump to the ends. Tab returns to the toggle
 *   that had focus last.
 * - With one or two toggles each toggle is its own tab stop and the group
 *   adds no keys.
 * - Inside a toolbar the toolbar's keys and tab stop apply; the group adds
 *   neither.
 * - Moving focus never changes a toggle. When the focused toggle is removed,
 *   focus goes to the toggle now at its place, or the last one.
 *
 * The rule itself (`roves`, `tabStop`, `move`, `refocusIndex`) is pure.
 * `manage` applies it to a group element in the page: tab stops, keys, and
 * following toggles that are added, removed or disabled. Adapters render the
 * group and call `manage` once it is in the page.
 */
export * from "./rule";
export * from "./dom";
