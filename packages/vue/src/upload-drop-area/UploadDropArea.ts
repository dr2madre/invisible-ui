import { defineComponent, h, onScopeDispose, ref, type PropType } from "vue";
import { useDropArea } from "../drop-area/use-drop-area";
import { useI18n } from "../i18n/i18n";
import { Loading } from "../loading/Loading";

export interface UploadDropAreaProps {
  /** Accepted file types (the input's `accept` attribute), e.g. "image/*". */
  accept?: string;
  /** Allow selecting/dropping more than one file. */
  multiple?: boolean;
  disabled?: boolean;
  /** Form field name (the underlying file input). */
  name?: string;
  /** Optional grey caption under the text (e.g. accepted formats / max size). */
  caption?: string;
  /** Called with the selected/dropped files. */
  onFiles?: (files: File[]) => void;
}

/** No-flash delay before the picker spinner appears, in ms. */
const PICKER_SPINNER_DELAY = 150;

/**
 * UploadDropArea — a drag-and-drop file area with a click-to-browse fallback,
 * ported from the Svelte adapter.
 *
 * Built on a native `<input type="file">` so the browser owns file selection,
 * keyboard operation and form participation; the styled area is a `<label>` for
 * that input, so clicking or pressing Enter/Space on it opens the picker. A
 * `dragover` highlight gives drag feedback, and dropped files are forwarded
 * through the same `onFiles` callback as picked files.
 *
 * Themeable via `--ds-upload-drop-area-*`. The default prompt comes from the
 * catalog (`uploadDropArea.prompt` plus the styled `uploadDropArea.action`
 * word); pass your own content in the default slot to replace it entirely.
 */
export const UploadDropArea = defineComponent({
  name: "UploadDropArea",
  props: {
    accept: { type: String, default: undefined },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    caption: { type: String, default: undefined },
    onFiles: { type: Function as PropType<(files: File[]) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    const emitFiles = (list: FileList | null | undefined) => {
      if (!list || !list.length) return;
      props.onFiles?.(Array.from(list));
    };

    // The drag target is the generic drop area (shared, Tree-ready); this
    // component adds the upload business: the file input and its picker.
    const { dropAreaProps } = useDropArea(() => ({
      disabled: props.disabled,
      onDrop: (data: DataTransfer) => emitFiles(data.files),
    }));

    // The native file dialog can take up to ~1s to appear (the OS builds the
    // panel). Per response-time UX (a wait past ~0.4–1s needs feedback), show a
    // loading indicator in that gap. The no-flash delay and the overlay live in
    // the shared Loading component (`delay` + `overlay`/`veil` options); here we
    // only own the trigger (the dialog opening) and the clear (the dialog
    // closing, i.e. window refocus, or a file being chosen or cancelled).
    const opening = ref(false);

    const resolveOpen = () => {
      opening.value = false;
      if (typeof window !== "undefined") window.removeEventListener("focus", resolveOpen);
    };

    const onOpen = () => {
      if (props.disabled) return;
      opening.value = true;
      // `once` auto-removes it after the dialog closes (window refocus); the
      // change/cancel paths also clear it early.
      window.addEventListener("focus", resolveOpen, { once: true });
    };

    const onInput = (event: Event) => {
      resolveOpen();
      emitFiles((event.currentTarget as HTMLInputElement).files);
    };

    onScopeDispose(resolveOpen);

    return () => {
      const { t } = i18n.value;

      return h(
        "label",
        {
          ...dropAreaProps.value,
          class: [
            "upload-drop-area",
            {
              "upload-drop-area--disabled": props.disabled,
              "upload-drop-area--opening": opening.value,
            },
          ],
          "aria-busy": opening.value ? "true" : undefined,
        },
        [
          h("input", {
            class: "upload-drop-area__input",
            type: "file",
            accept: props.accept,
            multiple: props.multiple,
            disabled: props.disabled,
            name: props.name,
            onClick: onOpen,
            onCancel: resolveOpen,
            onChange: onInput,
          }),

          h(
            "span",
            { class: "upload-drop-area__icon", "aria-hidden": "true" },
            slots.icon?.() ??
              h(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  width: "2em",
                  height: "2em",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "1.75",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                },
                [
                  h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                  h("polyline", { points: "17 8 12 3 7 8" }),
                  h("line", { x1: "12", y1: "3", x2: "12", y2: "15" }),
                ],
              ),
          ),

          h(
            "span",
            { class: "upload-drop-area__text" },
            slots.default?.() ?? [
              // Link-like affordance only: the real interactive element is the
              // label wired to the file input, so the action word stays a
              // non-semantic span.
              `${t("uploadDropArea.prompt")} `,
              h("span", { class: "upload-drop-area__action" }, t("uploadDropArea.action")),
            ],
          ),

          props.caption ? h("span", { class: "upload-drop-area__caption" }, props.caption) : null,

          // Reuse Loading's built-in delay (no flash on a fast open) plus the
          // overlay; no veil, since the OS dialog is already modal.
          opening.value
            ? h(Loading, {
                variant: "spinner",
                overlay: true,
                veil: false,
                delay: PICKER_SPINNER_DELAY,
                decorative: true,
              })
            : null,
        ],
      );
    };
  },
});
