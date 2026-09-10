import { formReset as core } from "@design-system/core";
import { onMounted, onUnmounted, watchPostEffect, type Ref } from "vue";

/** An element that can name its form owner. */
type Associated = Element & { form: HTMLFormElement | null };

/**
 * The owner to listen for: the element itself when it is form-associated (so
 * a `form` attribute is honoured), else the form it sits in.
 */
const associated = (node: Element | null): Associated | null => {
  if (!node) return null;
  if ("form" in node) return node as Associated;
  const enclosing = node.closest("form");
  return enclosing ? ({ form: enclosing } as Associated) : null;
};

/**
 * Put the control's state back when its owning form resets (ADR 0012). The
 * restore is read live, so it sees the current default; the owner is resolved
 * when the event arrives, so a moved control follows its new form.
 */
export function useFormReset(anchor: () => Element | null, restore: () => void): void {
  let stop: (() => void) | undefined;
  onMounted(() => {
    const node = anchor();
    if (!node) return;
    stop = core.onFormReset(node.ownerDocument, () => associated(anchor()), restore);
  });
  onUnmounted(() => stop?.());
}

/**
 * Keep a control's DOM property on the state while its attribute stays the
 * default. Vue writes the attribute alongside the property whenever `value`
 * or `checked` is a vnode prop, so the state is written here instead, after
 * the render that set the attribute.
 */
export function useLiveDom(
  element: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>,
  read: () => { value?: string; checked?: boolean },
): void {
  watchPostEffect(() => {
    const node = element.value;
    if (!node) return;
    const next = read();
    if (next.value !== undefined && node.value !== next.value) node.value = next.value;
    if (next.checked !== undefined && "checked" in node && node.checked !== next.checked) {
      (node as HTMLInputElement).checked = next.checked;
    }
  });
}
