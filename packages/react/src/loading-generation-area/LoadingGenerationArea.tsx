import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";

export type LoadingGenerationAreaPosition = "center" | "top" | "bottom" | "left" | "right";

export interface LoadingGenerationAreaProps {
  /** Accessible name. Defaults to the catalog's "Loading…". */
  label?: string;
  /** Hide from assistive technology (the surrounding region announces the state). */
  decorative?: boolean;
  /**
   * Whether the process is still running. While `true` (default) the loading
   * placeholder shows; set it to `false` when done and `children` (the real
   * content) render in its place.
   */
  loading?: boolean;
  /** Show the dot field as the backdrop. */
  field?: boolean;
  /** Where the label and indicator zone sits over the area. */
  labelPosition?: LoadingGenerationAreaPosition;
  /** Live status message, announced on every change. */
  status?: string;
  /** Percentage (0 to 100), shown as "N%". */
  value?: number | null;
  /** Extra detail line, such as "48 MB of 128 MB" or "3 of 8 files". */
  detail?: string;
  /** A loader shown in the label zone, such as a spinner when `field` is off. */
  indicator?: ReactNode;
  /** The real content, rendered once `loading` is `false`. */
  children?: ReactNode;
}

/**
 * LoadingGenerationArea: a surface that shows a process in progress, from
 * two parts.
 *
 * 1. A backdrop: a halftone dot field (`field`, on by default), a faint
 *    lattice of dots with soft, brighter zones that drift across it, so
 *    different areas seem to render over time. The dots are a CSS
 *    background, so it covers any size. Turn `field` off to use the component
 *    as a plain positioned loading area.
 * 2. A label zone, placed by `labelPosition`, with any of a live `status`
 *    message, a `value` percentage and a `detail` line.
 *
 * The dot field and an `indicator` are alternatives: turn `field` off and
 * pass another loader, such as `<Loading variant="spinner" decorative />`, to
 * use that one. Flip `loading` to `false` when done: `children` render in
 * place of the placeholder.
 *
 * Accessibility: a polite `role="status"` named by `label`. When `status` is
 * set it carries the announcement (the region is `aria-atomic`); the
 * percentage and detail stay visible and `aria-hidden`, so a fast-ticking
 * value is not read on every change. `decorative` hides it from assistive
 * technology. The drift stops under reduced motion. Themeable via
 * `--ds-loading-generation-area-*`.
 */
export function LoadingGenerationArea({
  label,
  decorative = false,
  loading = true,
  field = true,
  labelPosition = "center",
  status,
  value = null,
  detail,
  indicator,
  children,
}: LoadingGenerationAreaProps) {
  const { t } = useI18n();

  if (!loading) return <div className="loading-generation-area__content">{children}</div>;

  const clamped = value == null ? null : Math.min(100, Math.max(0, value));
  const hasStatus = status != null;
  const hasZone = hasStatus || clamped != null || detail != null || indicator != null;

  return (
    <div
      className={cx("loading-generation-area", field && "loading-generation-area--field")}
      data-position={labelPosition}
      role={decorative ? undefined : "status"}
      aria-label={decorative || hasStatus ? undefined : (label ?? t("loading.label"))}
      aria-atomic={hasStatus && !decorative ? "true" : undefined}
      aria-hidden={decorative ? "true" : undefined}
    >
      {hasZone ? (
        <div className="loading-generation-area__zone">
          {indicator}
          {hasStatus ? <span className="loading-generation-area__status">{status}</span> : null}
          {clamped != null ? (
            <span className="loading-generation-area__value" aria-hidden="true">
              {Math.round(clamped)}%
            </span>
          ) : null}
          {detail != null ? (
            <span className="loading-generation-area__detail" aria-hidden="true">
              {detail}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
