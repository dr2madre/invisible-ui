import { h, type VNode } from "vue";
import { Button } from "../button/Button";
import { FeedbackIcon } from "../feedback-icon/FeedbackIcon";
import { Icon } from "../icon/Icon";
import type { DialogNotice, DialogStatus } from "../internal/dialog-status";

export interface DialogStatusOptions {
  status: Pick<DialogStatus, "notices" | "announcement" | "dismissNotice">;
  /** Accessible name of each notice's close button. */
  closeLabel: string;
}

const closeGlyph = () =>
  h(Icon, null, {
    default: () => [
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  });

/**
 * The status area every dialog in the family shares (internal, ADR 0016):
 * the notices, then the persistent live region that announces them. Each
 * dialog places both between its body and its footer.
 *
 * A notice uses the Inline Notification markup inside a group named by its
 * title. It is not a live region itself, so it is never read twice, and it
 * never takes focus. The area is hidden while it holds no notice; the live
 * region stays in the panel, visually hidden, so it is never created at the
 * moment it speaks.
 */
export function dialogStatus({ status, closeLabel }: DialogStatusOptions): VNode[] {
  const noticeNode = (notice: DialogNotice) => {
    const titleId = `${notice.id}-title`;
    const { action } = notice;
    return h("div", { key: notice.id, id: notice.id, role: "group", "aria-labelledby": titleId }, [
      h("div", { class: "inline-notification", "data-status": notice.status }, [
        h(FeedbackIcon, { status: notice.status, shape: "rounded", box: "transparent" }),
        h("div", { class: "inline-notification__content" }, [
          h("p", { class: "inline-notification__title", id: titleId }, notice.title),
          notice.description
            ? h("div", { class: "inline-notification__body" }, notice.description)
            : null,
          action
            ? h("div", { class: "inline-notification__actions" }, [
                // Ghost, as in a notification: the action must not outweigh
                // the message.
                h(
                  Button,
                  {
                    variant: "ghost",
                    onPress: () => {
                      action.onAction();
                      status.dismissNotice(notice.id);
                    },
                  },
                  { default: () => action.label },
                ),
              ])
            : null,
        ]),
        notice.dismissible
          ? h("span", { class: "inline-notification__close" }, [
              h(
                Button,
                {
                  iconOnly: true,
                  variant: "ghost",
                  ariaLabel: closeLabel,
                  onPress: () => status.dismissNotice(notice.id),
                },
                { default: closeGlyph },
              ),
            ])
          : null,
      ]),
    ]);
  };

  const notices = status.notices.value;
  return [
    h("div", { class: "dialog-status", hidden: notices.length === 0 }, notices.map(noticeNode)),
    h(
      "div",
      { class: "dialog-status__live", role: "status", "aria-atomic": "true" },
      status.announcement.value.flatMap((line, index) => [h("p", { key: index }, line), " "]),
    ),
  ];
}
