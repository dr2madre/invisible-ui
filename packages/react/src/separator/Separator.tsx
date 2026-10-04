export interface SeparatorProps {
  /** Layout axis of the line. */
  orientation?: "horizontal" | "vertical";
  /** Hide from assistive tech (purely visual). */
  decorative?: boolean;
}

/**
 * Separator: a thin visual divider between content or groups of controls.
 *
 * Accessibility: by default it is a semantic separator (`role="separator"`
 * with `aria-orientation`). Set `decorative` when it carries no meaning (e.g.
 * purely visual spacing inside a toolbar that already groups its items) so it
 * is hidden from assistive tech.
 *
 * Color and thickness are themeable CSS custom properties (`--ds-separator-*`,
 * falling back to `--ds-color-border`).
 */
export function Separator({ orientation = "horizontal", decorative = false }: SeparatorProps) {
  return (
    <div
      className="separator"
      data-orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
    />
  );
}
