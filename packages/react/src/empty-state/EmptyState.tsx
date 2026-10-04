import type { ReactNode } from "react";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { stateActions, type StateAction } from "../internal/state-actions";

/** One entry of the configurable action group. */
export type EmptyStateAction = StateAction;

export interface EmptyStateProps {
  /** The headline: what this space is for, in plain language. */
  title: string;
  /** Optional secondary line: detail or the suggested next step. */
  description?: string;
  /** Feedback status driving the fallback icon's colour and glyph. */
  status?: FeedbackStatus;
  /** Heading level for the title, so it fits the surrounding document outline. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Action button label (such as "Add a project"). Omit it to render no button. */
  actionLabel?: string;
  /** Called when the action button is pressed. */
  onAction?: () => void;
  /**
   * The action area: entries, or markup of your own. An entry with `href`
   * renders a `Link`; the others render `Button`s, the first `default` and the
   * rest `ghost` unless an entry sets its own `variant`. Takes precedence over
   * `actionLabel`.
   */
  actions?: EmptyStateAction[] | ReactNode;
  /** Density: `md` for pages and sections, `sm` inside cards, panels and tables. */
  size?: "md" | "sm";
  /** Artwork of your own, in place of the fallback `FeedbackIcon`. */
  illustration?: ReactNode;
  /** Extra content between the description and the actions. */
  children?: ReactNode;
}

/**
 * EmptyState: a centred message for a space with nothing to show where
 * everything worked: a first run, an empty list, no search results. The
 * sibling of `ErrorState`, with the same layout and a calmer intent: the
 * action invites the user to start ("Add a project", "Clear filters").
 *
 * Layout: an illustration (`illustration`, else a neutral `FeedbackIcon`), a
 * `title`, an optional `description`, and an action area: one `Button` from
 * `actionLabel` and `onAction`, or the `actions` group. Themeable via
 * `--ds-empty-state-*`.
 *
 * Accessibility: the region is a polite `role="status"`, so content that
 * resolves to empty is announced without interrupting. The title carries the
 * meaning, never the colour alone.
 */
export function EmptyState({
  title,
  description,
  status = "neutral",
  headingLevel = 2,
  actionLabel,
  onAction,
  actions,
  size = "md",
  illustration,
  children,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  const actionArea = stateActions(actions, actionLabel, onAction);
  return (
    <div className="empty-state" role="status" data-size={size}>
      <span className="empty-state__illustration">
        {illustration ?? <FeedbackIcon status={status} box="tint" shape="round" />}
      </span>
      <Heading className="empty-state__title">{title}</Heading>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {children}
      {actionArea ? <div className="empty-state__actions">{actionArea}</div> : null}
    </div>
  );
}
