import type { ReactNode } from "react";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { stateActions, type StateAction } from "../internal/state-actions";

/** One entry of the configurable action group. */
export type ErrorStateAction = StateAction;

export interface ErrorStateProps {
  /** The headline: what went wrong, in plain language. */
  title: string;
  /** Optional secondary line: detail or next step. */
  description?: string;
  /** Feedback status driving the default icon's colour and glyph. */
  status?: FeedbackStatus;
  /** Heading level for the title, so it fits the surrounding document outline. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Recovery button label (such as "Try again"). Omit it to render no button. */
  actionLabel?: string;
  /** Called when the recovery button is pressed. */
  onAction?: () => void;
  /**
   * The action area: entries, or markup of your own. An entry with `href`
   * renders a `Link`; the others render `Button`s, the first `default` and the
   * rest `ghost` unless an entry sets its own `variant`. Takes precedence over
   * `actionLabel`.
   */
  actions?: ErrorStateAction[] | ReactNode;
  /** Density: `md` for pages and sections, `sm` inside cards, panels and tables. */
  size?: "md" | "sm";
  /** A glyph or artwork of your own, in place of the status `FeedbackIcon`. */
  icon?: ReactNode;
  /** Extra content between the description and the actions. */
  children?: ReactNode;
}

/**
 * ErrorState: a centred message for a page or a section where something went
 * wrong: a failed request, a server error, a lost connection. Use it when the
 * user needs to recover; for a space that is simply empty, use `EmptyState`.
 *
 * Layout: a status `FeedbackIcon` (danger by default, or `icon`), a `title`,
 * an optional `description`, and a recovery area: one `Button` from
 * `actionLabel` and `onAction` ("Try again"), or the `actions` group. An
 * error state replaces the content it covers, so it has no dismiss control.
 * Themeable via `--ds-error-state-*`.
 *
 * Accessibility: the region is a `role="alert"`, announced when it appears.
 * The title and the glyph carry the meaning, never the colour alone.
 */
export function ErrorState({
  title,
  description,
  status = "danger",
  headingLevel = 2,
  actionLabel,
  onAction,
  actions,
  size = "md",
  icon,
  children,
}: ErrorStateProps) {
  const Heading = `h${headingLevel}` as const;
  const actionArea = stateActions(actions, actionLabel, onAction);
  return (
    <div className="error-state" role="alert" data-size={size}>
      <span className="error-state__icon">
        {icon ?? <FeedbackIcon status={status} box="tint" shape="round" />}
      </span>
      <Heading className="error-state__title">{title}</Heading>
      {description ? <p className="error-state__description">{description}</p> : null}
      {children}
      {actionArea ? <div className="error-state__actions">{actionArea}</div> : null}
    </div>
  );
}
