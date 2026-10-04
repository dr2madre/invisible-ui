import type { CSSProperties, ReactNode } from "react";

export interface AspectRatioProps {
  /** Width-to-height ratio, such as `16 / 9`, `4 / 3` or `1`. */
  ratio?: number;
  /** The media or block content to fit in the box. */
  children?: ReactNode;
}

/**
 * AspectRatio: holds its content to a fixed width-to-height ratio with the
 * CSS `aspect-ratio` property. Presentational only (no role): an image,
 * video, iframe or any block content is cropped to fill the box.
 *
 * Radius is themeable via `--ds-aspect-ratio-radius`.
 */
export function AspectRatio({ ratio = 1, children }: AspectRatioProps) {
  return (
    <div
      className="aspect-ratio"
      // The shared sheet reads the ratio from this private custom property;
      // the prop always sets it, so an outside override could never win.
      style={{ "--_aspect-ratio": ratio } as CSSProperties}
      data-aspect-ratio=""
    >
      {children}
    </div>
  );
}
