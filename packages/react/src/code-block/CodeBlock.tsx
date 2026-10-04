import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { useCopyFeedback } from "../internal/copy-feedback";

export interface CodeBlockProps {
  /** The source text: what the copy button copies, and what shows without `children`. */
  code?: string;
  /** Optional caption in the header, such as a language or a filename. */
  language?: string;
  /** Render a copy button. Defaults to `true`. */
  copyable?: boolean;
  /** Name of the copy button. Defaults to the catalog's "Copy code". */
  copyLabel?: string;
  /** Already highlighted markup, shown in place of `code`. */
  children?: ReactNode;
}

/**
 * CodeBlock: a multi-line, monospaced, preformatted sample (`<pre><code>`)
 * with an optional caption and copy button. `code` keeps its whitespace and
 * is always rendered as text.
 *
 * There is no syntax highlighting: pass highlighted markup as `children`;
 * `code` still drives the copy button.
 *
 * Accessibility: the block is a named group, and so is the scroller, which
 * takes focus so keyboard users can scroll wide samples; several blocks on a
 * page stay off the landmark list. The copy button shares Button's copy logic
 * (ADR 0016) and announces success through a polite live region present from
 * the first render.
 *
 * Themeable via `--ds-code-block-*`.
 */
export function CodeBlock({
  code = "",
  language,
  copyable = true,
  copyLabel,
  children,
}: CodeBlockProps) {
  const { t } = useI18n();
  const { copied, copy } = useCopyFeedback();
  return (
    <figure
      className="code-block"
      role="group"
      aria-label={language ? t("codeBlock.labelLanguage", { language }) : t("codeBlock.label")}
    >
      {language || copyable ? (
        <figcaption className="code-block__header">
          {language ? <span className="code-block__lang">{language}</span> : null}
          {copyable ? (
            <button
              type="button"
              className="code-block__copy"
              aria-label={copyLabel ?? t("codeBlock.copy")}
              onClick={() => void copy(code)}
            >
              {t(copied ? "codeBlock.copiedText" : "codeBlock.copyText")}
            </button>
          ) : null}
        </figcaption>
      ) : null}
      <pre
        className="code-block__pre"
        // Wide code scrolls sideways, so the scroller is reachable by keyboard.
        tabIndex={0}
        role="group"
        aria-label={language ? t("codeBlock.sampleLanguage", { language }) : t("codeBlock.sample")}
      >
        <code className="code-block__code">{children ?? code}</code>
      </pre>
      <span className="code-block__live" role="status" aria-live="polite">
        {copied && copyable ? t("codeBlock.copied") : ""}
      </span>
    </figure>
  );
}
