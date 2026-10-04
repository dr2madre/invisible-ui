import { useId, type ComponentType, type ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { FeedbackIcon, type FeedbackStatus } from "../feedback-icon/FeedbackIcon";
import { useI18n } from "../i18n/i18n";
import { CloseGlyph, Icon } from "../icon/Icon";
import { useControllable } from "../internal/controllable";

/** An action button given as data. */
export interface InlineNotificationAction {
  label: string;
  variant?: ButtonVariant;
  onClick?: () => void;
}

export interface InlineNotificationProps {
  /** Feedback status: `info` | `success` | `warning` | `danger` | `neutral`. */
  status?: FeedbackStatus;
  /** Heading; it names the notification. */
  title: string;
  /** Body text. `children` replace it with rich content. */
  description: string;
  /** Link href. When set, and no `link` is given, a link renders. */
  href?: string;
  /** Link text. Defaults to the catalog's "Learn more". */
  linkText?: string;
  /** Action buttons as data, or markup of your own. */
  actions?: InlineNotificationAction[] | ReactNode;
  /** Render the close button. Defaults to `false`. */
  closable?: boolean;
  /** Close button name. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /**
   * Whether it shows. Closing hides it and reports `false` through
   * `onOpenChange`; set it back to `true` to show it again.
   */
  open?: boolean;
  /** Called when the close button hides the notification. */
  onOpenChange?: (open: boolean) => void;
  /**
   * `"status"` (polite live region, default) or `"alert"` (urgent).
   * `"region"` makes a named landmark. `"group"` is for a notification that a
   * live region elsewhere announces, as in a dialog's status area (ADR 0016):
   * it is named by its title and is not a live region itself.
   */
  role?: "status" | "alert" | "region" | "group";
  /** A high-contrast surface, the opposite of the page. */
  inverted?: boolean;
  /** No surface: no tint and no border; the coloured icon chip shows the status. */
  plain?: boolean;
  /** Shape of the icon box: `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /**
   * Icon box override. By default the box is tinted on a plain or inverted
   * notification and transparent on a tinted surface; set `"tint"` or
   * `"solid"` to force a chip there too.
   */
  iconBox?: "tint" | "transparent" | "solid";
  /**
   * Snackbar layout: one compact row with the icon, the title and inline
   * actions; the body is left out. Meant for the floating `Notification`.
   */
  snack?: boolean;
  /**
   * A component rendered as the body in place of `description` and
   * `children`, with `componentProps`, so a notifier given data can carry rich
   * content. Ignored in the `snack` layout.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the props are the component's own
  component?: ComponentType<any>;
  /** Props passed to `component`. */
  componentProps?: Record<string, unknown>;
  /** Called after the close button hid the notification. */
  onClose?: () => void;
  /** A custom glyph for the icon. */
  icon?: ReactNode;
  /** Link markup of your own, in place of the `href` link. */
  link?: ReactNode;
  /** Rich body content, in place of `description`. */
  children?: ReactNode;
}

/**
 * InlineNotification: a banner with a feedback message, built from a
 * `FeedbackIcon` for the status, a title, body text, an optional link, actions
 * and an optional close button.
 *
 * Accessibility: the container is a live region, a polite `role="status"` by
 * default; pass `role="alert"` for urgent messages. The title names it
 * (`aria-labelledby`, required for `role="region"`). The icon is decorative:
 * the text carries the meaning, and the colour, glyph and tint show the
 * status together. It is not dismissible by default; `closable` adds a ghost
 * close button with a name.
 *
 * Colours come from the theme tokens, so the surface follows light and dark.
 * Themeable via `--ds-inline-notification-*`.
 */
export function InlineNotification({
  status = "info",
  title,
  description,
  href,
  linkText,
  actions,
  closable = false,
  closeLabel,
  open = true,
  onOpenChange,
  role = "status",
  inverted = false,
  plain = false,
  iconShape = "rounded",
  iconBox,
  snack = false,
  component: Body,
  componentProps,
  onClose,
  icon,
  link,
  children,
}: InlineNotificationProps) {
  const { t } = useI18n();
  const titleId = `ds-alert-${useId()}-title`;
  const [isOpen, setOpen] = useControllable(open, onOpenChange);

  if (!isOpen) return null;

  const close = () => {
    setOpen(false);
    onClose?.();
  };
  // On a plain or inverted surface the tinted chip carries the status; on a
  // tinted surface the box goes transparent so it does not clash.
  const box = iconBox ?? (snack ? "transparent" : plain || inverted ? "tint" : "transparent");
  const actionItems = Array.isArray(actions) ? (actions as InlineNotificationAction[]) : [];
  const customActions = Array.isArray(actions) || actions === false ? null : actions;

  return (
    <div
      className="inline-notification"
      data-status={status}
      data-inverted={inverted ? "" : undefined}
      data-plain={plain ? "" : undefined}
      data-snack={snack ? "" : undefined}
      role={role}
      aria-labelledby={title ? titleId : undefined}
    >
      <FeedbackIcon status={status} shape={iconShape} box={box}>
        {icon}
      </FeedbackIcon>
      <div className="inline-notification__content">
        {title ? (
          <p className="inline-notification__title" id={titleId}>
            {title}
          </p>
        ) : null}
        {snack ? null : Body ? (
          <div className="inline-notification__body">
            <Body {...componentProps} />
          </div>
        ) : description || children != null ? (
          <div className="inline-notification__body">{children ?? description}</div>
        ) : null}
        {link ??
          (href ? (
            <a className="inline-notification__link" href={href}>
              {linkText ?? t("inlineNotification.learnMore")}
            </a>
          ) : null)}
        {actionItems.length || customActions != null ? (
          <div className="inline-notification__actions">
            {actionItems.length
              ? actionItems.map((action, index) => (
                  <Button
                    key={`${index}:${action.label}`}
                    variant={action.variant ?? "ghost"}
                    onPress={() => action.onClick?.()}
                  >
                    {action.label}
                  </Button>
                ))
              : customActions}
          </div>
        ) : null}
      </div>
      {closable ? (
        <span className="inline-notification__close">
          <Button
            iconOnly
            variant="ghost"
            ariaLabel={closeLabel ?? t("inlineNotification.close")}
            onPress={close}
          >
            <Icon>
              <CloseGlyph />
            </Icon>
          </Button>
        </span>
      ) : null}
    </div>
  );
}
