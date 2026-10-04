import type { ReactNode } from "react";
import { CheckGlyph, DangerGlyph, HazardGlyph, Icon, InfoGlyph, NeutralGlyph } from "../icon/Icon";

export type FeedbackStatus = "info" | "success" | "warning" | "danger" | "neutral";

export interface FeedbackIconProps {
  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  status?: FeedbackStatus;
  /** Accessible name. When omitted the box is decorative (`aria-hidden`). */
  label?: string;
  /**
   * Box treatment behind the glyph:
   * - `"tint"` (default): a soft status-coloured chip.
   * - `"transparent"`: the coloured glyph alone. Use it on surfaces that are
   *   already tinted, such as an Inline Notification, so the chip does not
   *   clash.
   * - `"solid"`: a full status-coloured box with a contrasting glyph.
   */
  box?: "tint" | "transparent" | "solid";
  /** Box shape: `"rounded"` (default) or a full `"round"` circle. */
  shape?: "rounded" | "round";
  /** A custom glyph, shown in place of the built-in one. */
  children?: ReactNode;
}

/** The built-in glyph of each status; an unknown status draws the info one. */
function StatusGlyph({ status }: { status: FeedbackStatus }) {
  if (status === "success") {
    return (
      <Icon size="100%" strokeWidth={2.5}>
        <CheckGlyph />
      </Icon>
    );
  }
  return (
    <Icon size="100%">
      {status === "warning" ? (
        <HazardGlyph />
      ) : status === "danger" ? (
        <DangerGlyph />
      ) : status === "neutral" ? (
        <NeutralGlyph />
      ) : (
        <InfoGlyph />
      )}
    </Icon>
  );
}

/**
 * FeedbackIcon: a status icon in a rounded, coloured box. It shows the type
 * of feedback (info, success, warning, danger, neutral) at a glance, beside
 * the text that carries the message.
 *
 * Each status has a built-in glyph; pass `children` to draw another. The box
 * is decorative by default (`aria-hidden`); pass `label` to expose it as an
 * image with an accessible name.
 *
 * Themeable via `--ds-feedback-icon-*` and the status colour tokens.
 */
export function FeedbackIcon({
  status = "info",
  label,
  box = "tint",
  shape = "rounded",
  children,
}: FeedbackIconProps) {
  return (
    <span
      className="feedback-icon"
      data-status={status}
      data-box={box}
      data-shape={shape}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {children ?? <StatusGlyph status={status} />}
    </span>
  );
}
