import type { ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { Link } from "../link/Link";

/** One entry of the action group of an Empty State or an Error State. */
export interface StateAction {
  label: string;
  onAction?: () => void;
  variant?: ButtonVariant;
  /** Renders the entry as a `Link` pointing here. */
  href?: string;
  /** Browsing context for a link entry, such as `"_blank"`. */
  target?: string;
}

/**
 * The action area that Empty State and Error State share: `actions` as
 * markup, else the `actions` entries (a `Link` for an entry with `href`, a
 * `Button` for the others, the first `default` and the rest `ghost` unless an
 * entry sets its own variant), else one `default` button from `actionLabel`.
 * Null when there is no action at all.
 */
export function stateActions(
  actions: readonly StateAction[] | ReactNode,
  actionLabel: string | undefined,
  onAction: (() => void) | undefined,
): ReactNode {
  if (isActionList(actions)) {
    if (actions.length) {
      return actions.map((action, index) =>
        action.href ? (
          <Link
            key={`${index}:${action.label}`}
            href={action.href}
            target={action.target}
            onClick={action.onAction}
          >
            {action.label}
          </Link>
        ) : (
          <Button
            key={`${index}:${action.label}`}
            variant={action.variant ?? (index === 0 ? "default" : "ghost")}
            onPress={action.onAction}
          >
            {action.label}
          </Button>
        ),
      );
    }
  } else if (actions != null && actions !== false) {
    return actions;
  }
  return actionLabel ? (
    <Button variant="default" onPress={onAction}>
      {actionLabel}
    </Button>
  ) : null;
}

const isActionList = (actions: unknown): actions is readonly StateAction[] =>
  Array.isArray(actions);
