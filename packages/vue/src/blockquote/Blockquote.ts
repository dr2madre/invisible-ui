import { defineComponent, h } from "vue";

export interface BlockquoteProps {
  /** Visible attribution text (e.g. an author). Use the `cite` slot for rich content. */
  cite?: string;
  /** Machine-readable source URL, mapped to the native `cite` attribute (not displayed). */
  citeUrl?: string;
}

/**
 * Blockquote — a block-level quotation (`<blockquote>`) with an optional
 * attribution line, ported from the Svelte adapter. The quoted text is the
 * default slot; the attribution can be passed as the `cite` prop (plain text)
 * or the `cite` slot (rich content).
 *
 * Accessibility:
 * - The quote uses the semantic `<blockquote>` element; the attribution sits in
 *   a `<figcaption>` so it is associated with the quote and stays out of the
 *   quoted text itself.
 * - `citeUrl` maps to the native `cite` attribute (a machine-readable source
 *   URL), which stays invisible, so provide a visible attribution too.
 *
 * Colors and the accent border are themeable CSS custom properties
 * (`--ds-blockquote-*`).
 */
export const Blockquote = defineComponent({
  name: "Blockquote",
  props: {
    cite: { type: String, default: undefined },
    citeUrl: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      h("figure", { class: "blockquote" }, [
        h("blockquote", { class: "blockquote__quote", cite: props.citeUrl }, slots.default?.()),
        props.cite || slots.cite
          ? h("figcaption", { class: "blockquote__cite" }, slots.cite?.() ?? props.cite)
          : null,
      ]);
  },
});
