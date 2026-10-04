import type { ReactNode } from "react";

export interface CodeProps {
  /** The code text. */
  children?: ReactNode;
}

/**
 * Code: inline code, a short run of monospaced text inside a sentence (the
 * `<code>` element), such as a function name, a flag or a value. For a
 * multi-line sample use `CodeBlock`.
 *
 * Presentational only: its content is the meaning. Themeable via
 * `--ds-code-*`.
 */
export function Code({ children }: CodeProps) {
  return <code className="code">{children}</code>;
}
