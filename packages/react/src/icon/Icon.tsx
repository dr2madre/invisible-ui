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

/** The check mark of a checked box, a selected option and a success message. */
export const CheckGlyph = () => <polyline points="20 6 9 17 4 12" />;

/** The magnifying glass that marks a search input or submits a search. */
export const SearchGlyph = () => (
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
);

/** The cross of a clear button. */
export const CloseGlyph = () => (
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

/** The downward chevron that opens a list. */
export const ChevronGlyph = () => <polyline points="6 9 12 15 18 9" />;
