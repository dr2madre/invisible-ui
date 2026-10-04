import { Fragment } from "react";
import { Button } from "../button/Button";
import { useI18n } from "../i18n/i18n";
import { FeedbackIcon } from "../feedback-icon/FeedbackIcon";
import { CloseGlyph, Icon } from "../icon/Icon";
import type { DialogNotice } from "./use-dialog-notices";

export interface DialogStatusProps {
  notices: readonly DialogNotice[];
  announcement: readonly string[];
  dismissNotice: (id: string) => void;
}

/**
 * The status area of a dialog (internal, ADR 0016), placed between the body
 * and the footer so its buttons follow the body in the tab order: the notices,
 * with the Inline Notification markup of the other adapters, and one
 * persistent polite live region that announces each notice once. The notices
 * are groups named by their title and never live regions themselves, so none
 * is read twice. The area is hidden while it holds no notice; the live region
 * stays in the panel, visually hidden, so it exists before it speaks.
 */
export function DialogStatus({ notices, announcement, dismissNotice }: DialogStatusProps) {
  const { t } = useI18n();
  const closeLabel = t("inlineNotification.close");

  return (
    <>
      <div className="dialog-status" hidden={notices.length === 0}>
        {notices.map((notice) => {
          const titleId = `${notice.id}-title`;
          return (
            <div key={notice.id} id={notice.id} role="group" aria-labelledby={titleId}>
              <div className="inline-notification" data-status={notice.status}>
                <FeedbackIcon status={notice.status} box="transparent" />
                <div className="inline-notification__content">
                  <p className="inline-notification__title" id={titleId}>
                    {notice.title}
                  </p>
                  {notice.description ? (
                    <div className="inline-notification__body">{notice.description}</div>
                  ) : null}
                  {notice.action ? (
                    <div className="inline-notification__actions">
                      {/* Ghost, as in a notification: the action must not
                          outweigh the message. */}
                      <Button
                        variant="ghost"
                        onPress={() => {
                          notice.action?.onAction();
                          dismissNotice(notice.id);
                        }}
                      >
                        {notice.action.label}
                      </Button>
                    </div>
                  ) : null}
                </div>
                {notice.dismissible ? (
                  <span className="inline-notification__close">
                    <Button
                      variant="ghost"
                      iconOnly
                      ariaLabel={closeLabel}
                      onPress={() => dismissNotice(notice.id)}
                    >
                      <Icon size="100%">
                        <CloseGlyph />
                      </Icon>
                    </Button>
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="dialog-status__live" role="status" aria-atomic="true">
        {announcement.map((line, index) => (
          <Fragment key={index}>
            <p>{line}</p>{" "}
          </Fragment>
        ))}
      </div>
    </>
  );
}
