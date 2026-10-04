import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDropArea } from "../drop-area/use-drop-area";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";
import { Loading } from "../loading/Loading";

export interface UploadDropAreaProps {
  /**
   * Accepted file types (the input's `accept` attribute), e.g. `"image/*"` or
   * `".pdf,.docx"`. The picker filters by it, and so does a drop.
   */
  accept?: string;
  /** Allow selecting or dropping more than one file. */
  multiple?: boolean;
  disabled?: boolean;
  /** Form field name (the underlying file input). */
  name?: string;
  /** Optional caption under the text, such as the accepted formats or the size limit. */
  caption?: string;
  /** Called with the selected or dropped files. */
  onFiles?: (files: File[]) => void;
  /** Replaces the default prompt text. */
  children?: ReactNode;
  /** Replaces the built-in upload icon. */
  icon?: ReactNode;
}

// The native file dialog can take up to a second to appear while the system
// builds it; a spinner past this delay covers the wait without a flash.
const PICKER_SPINNER_DELAY = 150;

/**
 * Whether a file matches an `accept` list, the way the file picker reads it:
 * comma-separated extensions (`.pdf`), MIME types (`image/png`) and type
 * wildcards (`image/*`). An empty list accepts everything.
 */
export function acceptsFile(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token.startsWith(".")
      ? name.endsWith(token)
      : token.endsWith("/*")
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
}

/**
 * UploadDropArea: a drag-and-drop file area with a click-to-browse fallback.
 *
 * Built on a native `<input type="file">`, so the browser owns file
 * selection, keyboard operation and form participation; the styled area is a
 * `<label>` for that input, so clicking it or pressing Enter or Space opens
 * the picker. A `dragover` highlight gives drag feedback, and dropped files
 * reach the same `onFiles` callback as picked ones. A drop keeps only the
 * files `accept` names, as the picker does, and the component never reads or
 * previews their content.
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
  children,
  icon,
}: UploadDropAreaProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const emit = (files: File[]) => {
    if (files.length > 0) onFiles?.(files);
  };

  // A dropped file joins the form the way a picked one does: it becomes the
  // input's file list, so it submits, and a form reset clears it. A single
  // file input holds one file, so a multi-file drop keeps the first.
  const adopt = (dropped: FileList) => {
    const kept = Array.from(dropped)
      .filter((file) => acceptsFile(file, accept))
      .slice(0, multiple ? undefined : 1);
    const input = inputRef.current;
    if (input && kept.length > 0 && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      for (const file of kept) transfer.items.add(file);
      input.files = transfer.files;
    }
    emit(kept);
  };

  const { dropAreaProps } = useDropArea({
    disabled,
    onDrop: (data) => adopt(data.files),
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

  return (
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
        onClick={() => {
          if (!disabled) setOpening(true);
        }}
        onChange={(event) => {
          setOpening(false);
          emit(Array.from(event.currentTarget.files ?? []));
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
  );
}
