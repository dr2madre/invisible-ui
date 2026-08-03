import { defineComponent, h, type PropType } from "vue";

export interface KbdProps {
  /** A chord of keys, each rendered as its own keycap and joined by `separator`. */
  keys?: string[];
  /** Separator shown between chord keys. Defaults to "+". */
  separator?: string;
}

/**
 * Kbd — a keyboard-shortcut hint rendered with the semantic `<kbd>` element,
 * ported from the Svelte adapter.
 *
 * Pass a single key as the default slot (`<Kbd>Esc</Kbd>`) or a chord as the
 * `keys` array (`:keys="['⌘', 'K']"`): each key gets its own nested `<kbd>` and
 * they are joined by a visible separator (default "+"). The outer element is a
 * `<kbd>` so assistive tech announces it as keyboard input.
 *
 * Presentational only, themeable via `--ds-kbd-*`.
 */
export const Kbd = defineComponent({
  name: "Kbd",
  props: {
    keys: { type: Array as PropType<string[]>, default: undefined },
    separator: { type: String, default: "+" },
  },
  setup(props, { slots }) {
    return () => {
      const keys = props.keys;
      if (!keys?.length) return h("kbd", { class: "kbd kbd__key" }, slots.default?.());

      return h(
        "kbd",
        { class: "kbd kbd--chord" },
        keys.flatMap((key, index) => [
          index > 0
            ? h(
                "span",
                { key: `sep-${index}`, class: "kbd__sep", "aria-hidden": "true" },
                props.separator,
              )
            : null,
          h("kbd", { key: `key-${index}`, class: "kbd__key" }, key),
        ]),
      );
    };
  },
});
