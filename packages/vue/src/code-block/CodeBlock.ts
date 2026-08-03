import { defineComponent, h, onScopeDispose, ref } from "vue";
import { useI18n } from "../i18n/i18n";

export interface CodeBlockProps {
  /** The source text. Drives the copy button and is rendered when no slot is given. */
  code?: string;
  /** Optional caption shown in the header (e.g. a language or filename). */
  language?: string;
  /** Render a copy-to-clipboard button. Defaults to `true`. */
  copyable?: boolean;
  /** Accessible name for the copy button. Defaults to the catalog's "Copy code". */
  copyLabel?: string;
}

/** How long the "Copied" confirmation stays up, in ms. */
const COPIED_DURATION = 2000;

/**
 * CodeBlock — block code: a multi-line, monospaced, preformatted snippet
 * (`<pre><code>`), ported from the Svelte adapter. Pass the source as the
 * `code` prop (it preserves whitespace and is what the copy button copies). An
 * optional `language`/filename caption and a copy-to-clipboard button can be
 * shown.
 *
 * This is a presentational container: syntax highlighting stays with the
 * caller, who can pass already-highlighted markup through the default slot (the
 * `code` prop still drives the copy button).
 *
 * Accessibility:
 * - The caption labels the region (`aria-label`) so screen-reader users know
 *   what the block contains.
 * - The copy button has an accessible name and announces success via a polite
 *   live region; it is omitted entirely when `copyable` is false.
 *
 * Colors are themeable CSS custom properties (`--ds-code-block-*`).
 */
export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: {
    code: { type: String, default: "" },
    language: { type: String, default: undefined },
    copyable: { type: Boolean, default: true },
    copyLabel: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();
    const copied = ref(false);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const copy = async () => {
      try {
        await navigator.clipboard?.writeText(props.code);
        copied.value = true;
        clearTimeout(timer);
        timer = setTimeout(() => (copied.value = false), COPIED_DURATION);
      } catch {
        // Clipboard may be unavailable (insecure context, denied permission);
        // stay quiet rather than throwing in the user's face.
      }
    };

    onScopeDispose(() => clearTimeout(timer));

    return () => {
      const { t } = i18n.value;
      const resolvedCopyLabel = props.copyLabel ?? t("codeBlock.copy");

      return h(
        "figure",
        {
          class: "code-block",
          role: "group",
          "aria-label": props.language ? `Code: ${props.language}` : "Code",
        },
        [
          props.language || props.copyable
            ? h("figcaption", { class: "code-block__header" }, [
                props.language ? h("span", { class: "code-block__lang" }, props.language) : null,
                props.copyable
                  ? h(
                      "button",
                      {
                        type: "button",
                        class: "code-block__copy",
                        "aria-label": resolvedCopyLabel,
                        onClick: copy,
                      },
                      copied.value ? "Copied" : "Copy",
                    )
                  : null,
              ])
            : null,
          h("pre", { class: "code-block__pre" }, [
            h("code", { class: "code-block__code" }, slots.default?.() ?? props.code),
          ]),
          h(
            "span",
            { class: "code-block__live", role: "status", "aria-live": "polite" },
            copied.value ? "Copied to clipboard" : "",
          ),
        ],
      );
    };
  },
});
