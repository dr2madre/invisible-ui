import { defineComponent, h, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { Link } from "../link/Link";

/** One entry of the configurable action group. */
export interface ErrorStateAction {
  label: string;
  onAction?: () => void;
  variant?: ButtonVariant;
  /** Renders the entry as a `Link` pointing here. */
  href?: string;
  /** Browsing context for a link entry, e.g. `"_blank"`. */
  target?: string;
}

export interface ErrorStateProps {
  /** The headline: what went wrong, in plain language. */
  title: string;
  /** Optional secondary line: detail or next step. */
  description?: string;
  /** Feedback status driving the default icon's color and glyph. */
  status?: FeedbackStatus;
  /** Heading level for the title, so it fits the surrounding document outline. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Recovery button label (e.g. "Try again"). Omit to render no button. */
  actionLabel?: string;
  /** Called when the recovery button is pressed. */
  onAction?: () => void;
  /**
   * Configurable action group. An entry with `href` renders a `Link` (a direct
   * pathway, e.g. "Learn more" documentation); the others render `Button`s: the
   * first gets the `default` variant and the rest `ghost`, unless an entry sets
   * its own `variant`. Takes precedence over `actionLabel`; the `actions` slot
   * replaces the whole area.
   */
  actions?: ErrorStateAction[];
  /** Density: `md` for full pages and sections, `sm` inside cards, panels and table areas. */
  size?: "md" | "sm";
}

/**
 * ErrorState — a centered, full-page (or full-section) message shown when
 * something has gone wrong: a failed request, a 500, a lost connection. Ported
 * from the Svelte adapter. Use it when an action or load failed and the user
 * needs to recover; for a space that is simply empty, use `EmptyState`.
 *
 * Layout: a status `FeedbackIcon` (danger by default), a `title`, an optional
 * `description`, and a recovery action area at the bottom: a single `Button`
 * from `actionLabel`/`onAction` (e.g. "Try again"), or a configurable group
 * from the `actions` prop. An error state replaces the content it covers, so it
 * carries no dismiss control.
 *
 * Reuses `FeedbackIcon` and `Button`. Swap the icon for another glyph or an
 * ad-hoc illustration via the `icon` slot (e.g. bespoke 404 artwork), or replace
 * the whole action area via the `actions` slot. Themeable via
 * `--ds-error-state-*`.
 *
 * Accessibility: the region is a `role="alert"`, so it is announced when it
 * appears. Meaning never rests on color alone: the title (and the icon glyph)
 * carry it (WCAG 1.4.1).
 */
export const ErrorState = defineComponent({
  name: "ErrorState",
  props: {
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    status: { type: String as PropType<FeedbackStatus>, default: "danger" },
    headingLevel: { type: Number as PropType<1 | 2 | 3 | 4 | 5 | 6>, default: 2 },
    actionLabel: { type: String, default: undefined },
    onAction: { type: Function as PropType<() => void>, default: undefined },
    actions: { type: Array as PropType<ErrorStateAction[]>, default: () => [] },
    size: { type: String as PropType<"md" | "sm">, default: "md" },
  },
  setup(props, { slots }) {
    return () => {
      const hasActions = Boolean(slots.actions || props.actions.length || props.actionLabel);

      const actionNodes = () => {
        if (props.actions.length) {
          return props.actions.map((action, index) =>
            action.href
              ? h(
                  Link,
                  {
                    key: action.label,
                    href: action.href,
                    target: action.target,
                    onClick: action.onAction,
                  },
                  { default: () => action.label },
                )
              : h(
                  Button,
                  {
                    key: action.label,
                    variant: action.variant ?? (index === 0 ? "default" : "ghost"),
                    onPress: action.onAction,
                  },
                  { default: () => action.label },
                ),
          );
        }
        if (props.actionLabel) {
          return [
            h(
              Button,
              { variant: "default", onPress: props.onAction },
              { default: () => props.actionLabel },
            ),
          ];
        }
        return undefined;
      };

      return h("div", { class: "error-state", role: "alert", "data-size": props.size }, [
        h(
          "span",
          { class: "error-state__icon" },
          slots.icon?.() ?? h(FeedbackIcon, { status: props.status, box: "tint", shape: "round" }),
        ),

        h(`h${props.headingLevel}`, { class: "error-state__title" }, props.title),

        props.description ? h("p", { class: "error-state__description" }, props.description) : null,

        slots.default?.(),

        hasActions
          ? h(
              "div",
              { class: "error-state__actions" },
              slots.actions ? slots.actions() : actionNodes(),
            )
          : null,
      ]);
    };
  },
});
