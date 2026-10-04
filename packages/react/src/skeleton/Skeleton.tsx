export interface SkeletonProps {
  variant?: "text" | "circle" | "rect";
  /** Number of lines for the `text` variant. */
  lines?: number;
  /** Any CSS length, such as "12rem" or "100%". For `circle`, also the height. */
  width?: string;
  /** Any CSS length. The `text` variant follows the line height instead. */
  height?: string;
  /** Border radius override (any CSS length). */
  radius?: string;
  /** Shimmer animation. Defaults to `pulse`. */
  animation?: "pulse" | "wave" | "none";
  /** When set, the skeleton becomes a polite status with this accessible name. */
  label?: string;
}

/**
 * Skeleton: a loading placeholder in the shape of the content it stands for.
 * Three shapes: `text` (one or more lines, the last one shorter), `circle`
 * (an avatar, say) and `rect` (an image or a card).
 *
 * Accessibility: purely visual, so hidden from assistive tech by default;
 * announce the loading on the surrounding region (`aria-busy="true"`). With
 * a `label` it is a polite `role="status"` instead.
 *
 * The shimmer is themeable via `--ds-skeleton-*` and stops under
 * `prefers-reduced-motion`.
 */
export function Skeleton({
  variant = "text",
  lines = 1,
  width,
  height,
  radius,
  animation = "pulse",
  label,
}: SkeletonProps) {
  // The size is the consumer's own length and the shared sheet has no
  // property for it, so it goes on the bar as the other adapters set it.
  return (
    <div
      className="skeleton"
      data-variant={variant}
      data-animation={animation}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-busy={label ? "true" : undefined}
      aria-hidden={label ? undefined : "true"}
    >
      {variant === "text" ? (
        Array.from({ length: Math.max(1, lines) }, (_, index) => (
          <span
            key={index}
            className="skeleton__bar skeleton__line"
            style={{
              width: index === lines - 1 && lines > 1 ? "60%" : width,
              borderRadius: radius,
            }}
          />
        ))
      ) : (
        <span
          className={variant === "circle" ? "skeleton__bar skeleton__circle" : "skeleton__bar"}
          style={{
            width,
            height: variant === "circle" ? (width ?? height) : height,
            borderRadius: radius,
          }}
        />
      )}
    </div>
  );
}
