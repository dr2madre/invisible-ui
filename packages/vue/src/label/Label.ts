import { defineComponent, h } from "vue";
import { useLabel } from "./use-label";

export interface LabelProps {
  /** Id of the control this labels (sets `for`). */
  for?: string;
  /** Show a required marker (`*`) after the text. */
  required?: boolean;
}

/**
 * Label: a styled form label associated with a control via `for`. Behaviour
 * (the association and preventing text selection on double-click) comes from
 * the headless label (`@design-system/core`); this layer adds typographic
 * styling and an optional required marker.
 *
 * The label text is the default slot. Colors are themeable via `--ds-label-*`.
 */
export const Label = defineComponent({
  name: "Label",
  props: {
    for: { type: String, default: undefined },
    required: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const api = useLabel(() => ({ for: props.for }));

    return () =>
      h("label", { class: "label", ...api.value.rootProps }, [
        slots.default?.(),
        props.required ? h("span", { class: "label__required", "aria-hidden": "true" }, "*") : null,
      ]);
  },
});
