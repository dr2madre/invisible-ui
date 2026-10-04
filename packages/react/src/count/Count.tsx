export type CountStatus = "danger" | "neutral" | "info" | "success" | "warning";

export interface CountProps {
  /** The number to display. */
  count?: number;
  /** Ceiling before showing "N+". Defaults to 99. */
  max?: number;
  /** Render a bare dot (a presence indicator) instead of a number. */
  dot?: boolean;
  /** Show the bubble even when `count` is 0. */
  showZero?: boolean;
  /** Status colour. Defaults to `danger`, the usual unread colour. */
  status?: CountStatus;
  /** Fuller accessible name, such as "3 unread messages". */
  label?: string;
}

/**
 * Count: the small number on a bell, an avatar or a tab that signals unread
 * or pending items.
 *
 * Past `max` it shows "N+"; at 0 it hides unless `showZero` is set; `dot`
 * shows a dot with no number.
 *
 * Accessibility: the digits are terse, so `label` gives the fuller name and
 * the digits are hidden from assistive tech. A dot has no text: with a
 * `label` it is a status, without one it is decorative.
 *
 * Colours are themeable (`--ds-count-*`), defaulting to the danger tokens.
 */
export function Count({
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  status = "danger",
  label,
}: CountProps) {
  if (!dot && !showZero && count <= 0) return null;
  if (dot) {
    return (
      <span
        className="count count--dot"
        data-status={status}
        role={label ? "status" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : "true"}
      />
    );
  }
  const display = count > max ? `${max}+` : `${count}`;
  return (
    <span className="count" data-status={status} role="status" aria-label={label ?? display}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
