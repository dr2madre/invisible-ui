import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  /** Rendered size; `1em` by default so icons scale with the surrounding text. */
  size?: string;
  viewBox?: string;
  /** Stroke width in viewBox units (glyphs are stroke-based by default). */
  strokeWidth?: number | string;
  /** Accessible name. When omitted the icon is decorative (`aria-hidden`). */
  label?: string;
  /** Extra classes merged onto the `<svg>` (e.g. for stateful styling). */
  className?: string;
  /** The glyph itself: `<path>`, `<line>`, `<polyline>`, … */
  children?: ReactNode;
}

/**
 * Icon — a standardized SVG wrapper, the React counterpart of the Svelte
 * adapter's `Icon`. It centralizes the boilerplate every inline `<svg>` would
 * otherwise repeat: a 24×24 viewBox, `1em` sizing, `currentColor`, rounded
 * stroke joins and accessibility.
 *
 * Decorative by default; pass `label` to expose it as an image with a name.
 */
export function Icon({
  size = "1em",
  viewBox = "0 0 24 24",
  strokeWidth = 2,
  label,
  className,
  children,
}: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
      style={{ display: "inline-block", flex: "none", verticalAlign: "middle" } as CSSProperties}
    >
      {children}
    </svg>
  );
}

/** The plus glyph used as the Button's default leading/trailing icon. */
export const PlusGlyph = () => (
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

/** The hazard triangle that keeps `danger` from relying on colour alone. */
export const HazardGlyph = () => (
  <>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </>
);
