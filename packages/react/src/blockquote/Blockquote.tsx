import type { ReactNode } from "react";

export interface BlockquoteProps {
  /** Visible attribution, such as an author: text or markup. */
  cite?: ReactNode;
  /** Machine-readable source URL, set as the native `cite` attribute (not shown). */
  citeUrl?: string;
  /** The quoted text. */
  children?: ReactNode;
}

/**
 * Blockquote: a block quotation (`<blockquote>`) with an optional
 * attribution line.
 *
 * Accessibility: the attribution sits in a `<figcaption>`, so it belongs to
 * the quote without being read as part of it. `citeUrl` is not visible, so
 * give a visible attribution too.
 *
 * Themeable via `--ds-blockquote-*`.
 */
export function Blockquote({ cite, citeUrl, children }: BlockquoteProps) {
  return (
    <figure className="blockquote">
      <blockquote className="blockquote__quote" cite={citeUrl}>
        {children}
      </blockquote>
      {cite ? <figcaption className="blockquote__cite">{cite}</figcaption> : null}
    </figure>
  );
}
