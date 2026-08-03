import { defineComponent, h } from "vue";

/**
 * Code — inline code: a short run of monospaced text inside a sentence (the
 * `<code>` element), e.g. a function name, a flag, or a value. For a multi-line
 * block use `CodeBlock`. Ported from the Svelte adapter.
 *
 * Presentational only: its content is the meaning. Colors and the surface tint
 * are themeable CSS custom properties (`--ds-code-*`).
 */
export const Code = defineComponent({
  name: "Code",
  setup(_props, { slots }) {
    return () => h("code", { class: "code" }, slots.default?.());
  },
});
