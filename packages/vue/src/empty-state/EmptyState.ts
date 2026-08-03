import { defineComponent, h, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { Link } from "../link/Link";

/** One entry of the configurable action group. */
export interface EmptyStateAction {
  label: string;
  onAction?: () => void;
  variant?: ButtonVariant;
  /** Renders the entry as a `Link` pointing here. */
  href?: string;
  /** Browsing context for a link entry, e.g. `"_blank"`. */
  target?: string;
}

export interface EmptyStateProps {
  /** The headline: what this space is for, in plain language. */
  title: string;
  /** Optional secondary line: detail or the suggested next step. */
  description?: string;
  /** Feedback status driving the fallback icon's color and glyph. */
  status?: FeedbackStatus;
  /** Heading level for the title, so it fits the surrounding document outline. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Action button label (e.g. "Add a project"). Omit to render no button. */
  actionLabel?: string;
  /** Called when the action button is pressed. */
  onAction?: () => void;
  /**
   * Configurable action group. An entry with `href` renders a `Link` (a direct
   * pathway, e.g. "Learn more" documentation); the others render `Button`s: the
   * first gets the `default` variant and the rest `ghost`, unless an entry sets
   * its own `variant`. Takes precedence over `actionLabel`; the `actions` slot
   * replaces the whole area.
   */
  actions?: EmptyStateAction[];
  /** Density: `md` for full pages and sections, `sm` inside cards, panels and table areas. */
  size?: "md" | "sm";
}

/**
 * EmptyState — a centered message shown when there is no content to show and
 * everything worked: first run, an empty list, no search results. Ported from
 * the Svelte adapter. The sibling of `ErrorState` (something *failed*): same
 * layout, calmer intent. The user needs to get started, so the action is an
 * invitation ("Add a project", "Clear filters").
 *
 * Layout: an illustration area, a `title`, an optional `description`, and an
 * action area at the bottom. The illustration area accepts bespoke artwork via
 * the `illustration` slot and falls back to the theme's `FeedbackIcon` (neutral
 * by default). The action area renders a single `Button` from
 * `actionLabel`/`onAction`, a configurable group from the `actions` prop, or any
 * custom content via the `actions` slot. Themeable via `--ds-empty-state-*`.
 *
 * Accessibility: the region is a `role="status"` (polite live region), so when
 * content resolves to empty the change is announced without interrupting.
 * Meaning never rests on color alone: the title carries it (WCAG 1.4.1).
 */
export const EmptyState = defineComponent({
  name: "EmptyState",
  props: {
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    status: { type: String as PropType<FeedbackStatus>, default: "neutral" },
    headingLevel: { type: Number as PropType<1 | 2 | 3 | 4 | 5 | 6>, default: 2 },
    actionLabel: { type: String, default: undefined },
    onAction: { type: Function as PropType<() => void>, default: undefined },
    actions: { type: Array as PropType<EmptyStateAction[]>, default: () => [] },
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
                    onPress: action.onAction,
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

      return h("div", { class: "empty-state", role: "status", "data-size": props.size }, [
        h(
          "span",
          { class: "empty-state__illustration" },
          slots.illustration?.() ??
            h(FeedbackIcon, { status: props.status, box: "tint", shape: "round" }),
        ),

        h(`h${props.headingLevel}`, { class: "empty-state__title" }, props.title),

        props.description ? h("p", { class: "empty-state__description" }, props.description) : null,

        slots.default?.(),

        hasActions
          ? h(
              "div",
              { class: "empty-state__actions" },
              slots.actions ? slots.actions() : actionNodes(),
            )
          : null,
      ]);
    };
  },
});
