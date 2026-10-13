import { uploadDropArea } from "@design-system/core";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDropArea } from "../drop-area/use-drop-area";
import { useI18n } from "../i18n/i18n";
import { HazardGlyph, Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { Loading } from "../loading/Loading";

/** A file the area left out, and why: `type` (not in `accept`) or `count`. */
export type UploadRejection = uploadDropArea.UploadRejection;

export interface UploadDropAreaProps {
  /**
   * Accepted file types (the input's `accept` attribute), e.g. `"image/*"` or
   * `".pdf,.docx"`. Picked and dropped files go through the same filter; the
   * files it leaves out are named in a message under the area and reported
   * to `onRejected`. The filter is a convenience: the app still validates
   * the files it receives.
   */
  accept?: string;
  /** Allow selecting or dropping more than one file. */
  multiple?: boolean;
  disabled?: boolean;
  /** Form field name (the underlying file input). */
  name?: string;
  /** Optional caption under the text, such as the accepted formats or the size limit. */
  caption?: string;
  /** Called with the selected or dropped files the area takes. */
  onFiles?: (files: File[]) => void;
  /**
   * Called with the files the area left out: a type `accept` does not name,
   * or a file beyond the first in an area without `multiple`.
   */
  onRejected?: (rejected: UploadRejection[]) => void;
  /** Replaces the default prompt text. */
  children?: ReactNode;
  /** Replaces the built-in upload icon. */
  icon?: ReactNode;
}

// The native file dialog can take up to a second to appear while the system
// builds it; a spinner past this delay covers the wait without a flash.
const PICKER_SPINNER_DELAY = 150;

/**
 * UploadDropArea: a drag-and-drop file area with a click-to-browse fallback.
 *
 * Built on a native `<input type="file">`, so the browser owns file
 * selection, keyboard operation and form participation; the styled area is a
 * `<label>` for that input, so clicking it or pressing Enter or Space opens
 * the picker. A `dragover` highlight gives drag feedback, and dropped files
 * reach the same `onFiles` callback as picked ones. Picked and dropped files
 * go through the same `accept` filter; the files it leaves out are named in
 * a message under the area, announced as an alert, and reported to
 * `onRejected`. The component never reads or previews file content.
 *
 * Themeable via `--ds-upload-drop-area-*`. The default prompt comes from the
 * catalog (`uploadDropArea.prompt` and the styled `uploadDropArea.action`
 * word); `children` replace it entirely.
 */
export function UploadDropArea({
  accept,
  multiple = false,
  disabled = false,
  name,
  caption,
  onFiles,
  onRejected,
  children,
  icon,
}: UploadDropAreaProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const rejectedId = `ds-${useId()}-rejected`;
  // Each batch gets its own key, so the same rejection twice is a new alert.
  const [rejection, setRejection] = useState<{ batch: number; files: UploadRejection[] }>({
    batch: 0,
    files: [],
  });

  // Picked and dropped files go through the same filter. The input holds the
  // files the area takes, so they submit and a form reset clears them; a
  // drop with none to take leaves the input as it was.
  const take = (files: File[], dropped: boolean) => {
    const { accepted, rejected } = uploadDropArea.splitFiles(files, { accept, multiple });
    const input = inputRef.current;
    if (input && (dropped ? accepted.length > 0 : rejected.length > 0)) {
      if (accepted.length === 0) input.value = "";
      else if (typeof DataTransfer !== "undefined") {
        const transfer = new DataTransfer();
        for (const file of accepted) transfer.items.add(file);
        input.files = transfer.files;
      }
    }
    setRejection((previous) => ({ batch: previous.batch + 1, files: rejected }));
    if (rejected.length > 0) onRejected?.(rejected);
    if (accepted.length > 0) onFiles?.(accepted);
  };

  const { dropAreaProps } = useDropArea({
    disabled,
    onDrop: (data) => take(Array.from(data.files), true),
  });

  // The picker is opening from the click until a file is chosen, the dialog
  // is cancelled, or the window gets focus back as the dialog closes. Loading
  // owns the no-flash delay and the overlay; this owns only that window.
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    const input = inputRef.current;
    if (!opening || !input) return;
    const close = () => setOpening(false);
    window.addEventListener("focus", close, { once: true });
    // React listens for `cancel` on a dialog only, so the input's is wired here.
    input.addEventListener("cancel", close);
    return () => {
      window.removeEventListener("focus", close);
      input.removeEventListener("cancel", close);
    };
  }, [opening]);

  const rejected = rejection.files;
  return (
    <>
      <label
        {...dropAreaProps}
        className={cx(
          "upload-drop-area",
          disabled && "upload-drop-area--disabled",
          opening && "upload-drop-area--opening",
        )}
        aria-busy={opening ? "true" : undefined}
      >
        <input
          ref={inputRef}
          className="upload-drop-area__input"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          name={name}
          aria-describedby={rejected.length > 0 ? rejectedId : undefined}
          onClick={() => {
            if (!disabled) setOpening(true);
          }}
          onChange={(event) => {
            setOpening(false);
            const files = Array.from(event.currentTarget.files ?? []);
            if (files.length > 0) take(files, false);
          }}
        />
        <span className="upload-drop-area__icon" aria-hidden="true">
          {icon ?? (
            <svg
              viewBox="0 0 24 24"
              width="2em"
              height="2em"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </span>
        <span className="upload-drop-area__text">
          {children ?? (
            // The action word only looks like a link: the label and its file
            // input are the interactive element, so the word stays a plain span.
            <>
              {`${t("uploadDropArea.prompt")} `}
              <span className="upload-drop-area__action">{t("uploadDropArea.action")}</span>
            </>
          )}
        </span>
        {caption ? <span className="upload-drop-area__caption">{caption}</span> : null}
        {opening ? (
          // No veil: the system dialog is already modal.
          <Loading variant="spinner" overlay veil={false} delay={PICKER_SPINNER_DELAY} decorative />
        ) : null}
      </label>
      {rejected.length > 0 ? (
        // Outside the label, so it never joins the input's name; announced
        // when it appears, with the hazard glyph so it never relies on color.
        <div
          key={rejection.batch}
          id={rejectedId}
          className="upload-drop-area__rejected"
          role="alert"
        >
          {rejected.map(({ file, reason }, index) => (
            <p key={index} className="field__error field__message">
              <span className="field__msg-icon" aria-hidden="true">
                <Icon size="1em">
                  <HazardGlyph />
                </Icon>
              </span>
              {t(
                reason === "type" ? "uploadDropArea.rejectedType" : "uploadDropArea.rejectedCount",
                {
                  name: file.name,
                },
              )}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}
