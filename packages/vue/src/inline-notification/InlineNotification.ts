import { defineComponent, h, ref, watch, type Component, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { useStableId } from "../internal/use-stable-id";

/** A data-driven action button (alternative to the `actions` slot). */
export interface InlineNotificationAction {
  label: string;
  variant?: ButtonVariant;
  onClick?: () => void;
}

export interface InlineNotificationProps {
  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  status?: FeedbackStatus;
  /** Heading (required). */
  title: string;
  /** Body text (required). Override with the default slot for rich content. */
  description: string;
  /** Link href. When set (and no `link` slot is provided) a link is rendered. */
  href?: string;
  /** Link text. Defaults to the i18n catalog's "Learn more". */
  linkText?: string;
  /** Action buttons (alternative to the `actions` slot). */
  actions?: InlineNotificationAction[];
  /** Render the close button. Defaults to `false` (not dismissible). */
  closable?: boolean;
  /** Close button accessible name. Defaults to the i18n catalog's "Close". */
  closeLabel?: string;
  /**
   * Controls visibility; bindable with `v-model:open`. Dismissing sets it to
   * `false`; set it back to `true` to show the notification again.
   */
  open?: boolean;
  /** Live-region role. `"status"` (polite) by default; `"alert"` for urgent. */
  role?: "status" | "alert" | "region";
  /** High-contrast inverse surface (opposite of the page) for maximum visibility. */
  inverted?: boolean;
  /**
   * No-surface variant: drop the tinted background and border (the message sits
   * on the page). The status stays visible via the colored FeedbackIcon chip.
   */
  plain?: boolean;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /**
   * FeedbackIcon box override. By default the box is tinted on plain/inverted
   * notifications and transparent on tinted surfaces (so it doesn't clash);
   * set `"tint"` or `"solid"` to force a visible chip on a tinted surface too.
   */
  iconBox?: "tint" | "transparent" | "solid";
  /**
   * Snackbar layout: one compact, vertically-centered row — icon, title and
   * inline actions — in a container that wraps its content. The description is
   * dropped and the icon takes the text color with no box. Meant for the
   * floating `Notification`, not the in-page banner.
   */
  snack?: boolean;
  /**
   * Render arbitrary content as the body instead of `description` / the
   * default slot — a Vue component plus its props. Lets a data-driven notifier
   * carry rich content (a file preview, an avatar row). Ignored in `snack`
   * layout.
   */
  component?: Component;
  /** Props passed to `component`. */
  componentProps?: Record<string, unknown>;
  /** Called when dismissed. */
  onClose?: () => void;
}

// Stable per-instance title ids, as in Select: a module counter keeps the Vue
// peer range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * InlineNotification — a banner that communicates a feedback message, ported
 * from the Svelte adapter and composed from the existing building blocks: a
 * FeedbackIcon (status), a title, body text, an optional link, and an optional
 * close button.
 *
 * Accessibility:
 * - The container is a live region. `role` defaults to `"status"` (polite);
 *   pass `role="alert"` for urgent, interrupting messages. The title names
 *   the container via `aria-labelledby` (required when `role="region"`).
 * - The FeedbackIcon is decorative (the message text carries the meaning); the
 *   status is also conveyed visually by color + glyph + surface tint, so it
 *   never relies on color alone.
 * - Not dismissible by default — set `closable` to render the ghost close
 *   button (WCAG-sized hit area, accessible name).
 *
 * Colors come from the theme token layer (`--ds-color-*`), so the surface
 * adapts to light/dark. Set `inverted` for a high-contrast surface (the
 * opposite of the page) — useful for transient notices.
 */
export const InlineNotification = defineComponent({
  name: "InlineNotification",
  props: {
    status: { type: String as PropType<FeedbackStatus>, default: "info" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    href: { type: String, default: undefined },
    linkText: { type: String, default: undefined },
    actions: { type: Array as PropType<InlineNotificationAction[]>, default: undefined },
    closable: { type: Boolean, default: false },
    closeLabel: { type: String, default: undefined },
    open: { type: Boolean, default: true },
    role: { type: String as PropType<"status" | "alert" | "region">, default: "status" },
    inverted: { type: Boolean, default: false },
    plain: { type: Boolean, default: false },
    iconShape: { type: String as PropType<"rounded" | "round">, default: "rounded" },
    iconBox: { type: String as PropType<"tint" | "transparent" | "solid">, default: undefined },
    snack: { type: Boolean, default: false },
    component: { type: Object as PropType<Component>, default: undefined },
    componentProps: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    onClose: { type: Function as PropType<() => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    const titleId = `${useStableId("ds-alert")}-title`;

    // Mirror an externally controlled `open` (dismissing flips it locally).
    const open = ref(props.open);
    watch(
      () => props.open,
      (next) => {
        open.value = next;
      },
    );

    const close = () => {
      open.value = false;
      emit("update:open", false);
      props.onClose?.();
    };

    return () => {
      if (!open.value) return null;

      const { t } = i18n.value;
      const resolvedLinkText = props.linkText ?? t("inlineNotification.learnMore");
      const resolvedCloseLabel = props.closeLabel ?? t("inlineNotification.close");

      // On the plain (no-surface) variant the colored chip carries the status;
      // on a tinted surface the chip box goes transparent so it doesn't clash.
      // Pass a custom glyph via the `icon` slot (forwarded to the FeedbackIcon).
      const box =
        props.iconBox ??
        (props.snack ? "transparent" : props.plain || props.inverted ? "tint" : "transparent");

      const body = props.snack
        ? null
        : props.component
          ? h("div", { class: "inline-notification__body" }, [
              h(props.component, props.componentProps),
            ])
          : props.description || slots.default
            ? h(
                "div",
                { class: "inline-notification__body" },
                slots.default ? slots.default() : props.description,
              )
            : null;

      const link = slots.link
        ? slots.link()
        : props.href
          ? h("a", { class: "inline-notification__link", href: props.href }, resolvedLinkText)
          : null;

      const actions =
        props.actions?.length || slots.actions
          ? h(
              "div",
              { class: "inline-notification__actions" },
              props.actions?.length
                ? props.actions.map((action) =>
                    h(
                      Button,
                      {
                        key: action.label,
                        variant: action.variant ?? "ghost",
                        onPress: () => action.onClick?.(),
                      },
                      { default: () => action.label },
                    ),
                  )
                : slots.actions?.(),
            )
          : null;

      return h(
        "div",
        {
          class: "inline-notification",
          "data-status": props.status,
          "data-inverted": props.inverted ? "" : undefined,
          "data-plain": props.plain ? "" : undefined,
          "data-snack": props.snack ? "" : undefined,
          role: props.role,
          "aria-labelledby": props.title ? titleId : undefined,
        },
        [
          h(
            FeedbackIcon,
            { status: props.status, shape: props.iconShape, box },
            slots.icon ? { default: slots.icon } : undefined,
          ),
          h("div", { class: "inline-notification__content" }, [
            props.title
              ? h("p", { class: "inline-notification__title", id: titleId }, props.title)
              : null,
            body,
            link,
            actions,
          ]),
          props.closable
            ? h("span", { class: "inline-notification__close" }, [
                h(
                  Button,
                  {
                    iconOnly: true,
                    variant: "ghost",
                    ariaLabel: resolvedCloseLabel,
                    onPress: close,
                  },
                  {
                    default: () =>
                      h(Icon, null, {
                        default: () => [
                          h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                          h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
                        ],
                      }),
                  },
                ),
              ])
            : null,
        ],
      );
    };
  },
});
