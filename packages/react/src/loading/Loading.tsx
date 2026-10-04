import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";

export type LoadingVariant = "dots" | "spinner" | "bar" | "typing" | "morph";

export interface LoadingProps {
  /**
   * Indicator shape: pulsing `dots`, a rotating `spinner` arc, bouncing
   * `typing` dots (waiting for a chat reply), a `morph`ing shape (square to
   * circle), or a `bar` (a full-width track: place it at the top of the
   * content it covers). For a whole surface that renders, use
   * `LoadingGenerationArea`.
   */
  variant?: LoadingVariant;
  /**
   * Completion percentage (0 to 100) for the `bar` variant: the bar becomes
   * determinate, a fill that grows to done, with progressbar semantics.
   * Leave it `null` for the indeterminate sliding segment.
   */
  value?: number | null;
  /** Accessible name. Defaults to the catalog's "Loading…". */
  label?: string;
  /** Also show the label as visible text next to the indicator. */
  showLabel?: boolean;
  /** Show the percentage (from `value`) as visible text. */
  showValue?: boolean;
  /**
   * Extra visible detail, such as "3 of 8 files". On a determinate bar it is
   * also the `aria-valuetext`.
   */
  detail?: string;
  /** Hide from assistive technology (the surrounding region announces the state). */
  decorative?: boolean;
  /**
   * Live status message: what the process is doing now ("Connecting…",
   * "Fetching records…"). It shows as text inside the polite `role="status"`
   * region and is announced in full on every change. On a determinate bar it
   * shows below the track and is the `aria-valuetext` when no `detail` is
   * set. Ignored when `decorative`.
   */
  status?: string;
  /**
   * No-flash delay in ms: the indicator stays hidden until this long has
   * passed, so a fast operation never flashes a loader. Read once, when the
   * component mounts. Default `0` (shown at once).
   */
  delay?: number;
  /**
   * Render as a centred overlay over the nearest positioned ancestor. Mark
   * that region `aria-busy="true"`.
   */
  overlay?: boolean;
  /**
   * With `overlay`: a translucent backdrop that also blocks the pointer while
   * busy. Set `false` to overlay the indicator alone.
   */
  veil?: boolean;
}

const SPINNER = (
  <svg
    className="loading__spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </svg>
);

const DOTS = (
  <>
    <span className="loading__dot" />
    <span className="loading__dot" />
    <span className="loading__dot" />
  </>
);

/**
 * Loading: an inline loading indicator. Variants: `dots`, `spinner`,
 * `typing`, `morph` and `bar` (an indeterminate sliding segment, or a growing
 * fill when given a `value`). Everything draws in `currentColor`, so it
 * follows the text colour of its surface.
 *
 * Accessibility: a polite `role="status"` named by `label` (the catalog's
 * "Loading…" by default). A determinate bar is a `progressbar` with its ARIA
 * value, and `aria-valuetext` when `detail` or `status` is set. The visible
 * label, percentage and detail are `aria-hidden`: the name and value already
 * carry them, and a percentage that ticks inside a live region would be read
 * on every change. Set `decorative` when the surrounding region announces the
 * state itself. Under reduced motion the indicators stay visible and still.
 *
 * Sizing follows the font (`1em`); themeable via `--ds-loading-*`.
 */
export function Loading({
  variant = "dots",
  value = null,
  label,
  showLabel = false,
  showValue = false,
  detail,
  decorative = false,
  status,
  delay = 0,
  overlay = false,
  veil = true,
}: LoadingProps) {
  const { t } = useI18n();
  // The delay counts from mount. The server and the first client render agree
  // on the hidden state, and the timer runs in the browser only.
  const [initialDelay] = useState(delay);
  const [visible, setVisible] = useState(initialDelay <= 0);
  useEffect(() => {
    if (initialDelay <= 0) return;
    const timer = setTimeout(() => setVisible(true), initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  if (!visible) return null;

  const resolvedLabel = label ?? t("loading.label");
  const hasStatus = status != null;
  const determinate = variant === "bar" && value != null;
  const clamped = value == null ? null : Math.min(100, Math.max(0, value));
  const hasText = showLabel || detail != null || (showValue && clamped != null);
  const announcesValue = determinate && !decorative;

  return (
    <span
      className={cx("loading", overlay && "loading--overlay", overlay && veil && "loading--veil")}
      data-variant={variant}
      role={decorative ? undefined : determinate ? "progressbar" : "status"}
      aria-label={decorative || (hasStatus && !determinate) ? undefined : resolvedLabel}
      aria-atomic={hasStatus && !decorative ? "true" : undefined}
      aria-hidden={decorative ? "true" : undefined}
      aria-valuemin={announcesValue ? 0 : undefined}
      aria-valuemax={announcesValue ? 100 : undefined}
      aria-valuenow={announcesValue ? (clamped ?? undefined) : undefined}
      aria-valuetext={announcesValue ? (detail ?? status) : undefined}
    >
      {variant === "bar" ? (
        <span className="loading__track">
          {determinate ? (
            // The fill follows the value and the shared sheet leaves its size
            // to the adapter, so it goes inline as in the other adapters.
            <span className="loading__fill" style={{ inlineSize: `${clamped}%` }} />
          ) : (
            <span className="loading__segment" />
          )}
        </span>
      ) : (
        <span className="loading__indicator">
          {variant === "spinner" ? (
            SPINNER
          ) : variant === "morph" ? (
            <span className="loading__shape" />
          ) : (
            DOTS
          )}
        </span>
      )}
      {/* Visible and announced; on a determinate bar the announcement travels
          through aria-valuetext. */}
      {hasStatus ? <span className="loading__status">{status}</span> : null}
      {hasText ? (
        <span className="loading__label" aria-hidden="true">
          {showLabel ? <span>{resolvedLabel}</span> : null}
          {showValue && clamped != null ? (
            <span className="loading__meta">{Math.round(clamped)}%</span>
          ) : null}
          {detail != null ? <span className="loading__meta">{detail}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
