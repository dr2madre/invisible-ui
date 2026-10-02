import { formReset as core } from "@design-system/core";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";

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
    // Every control anchors on an element it renders unconditionally, so one
    // look at mount is enough; the owner itself is resolved again at event
    // time, which is what a moved control needs.
    const node = anchor();
    if (!node) return;
    stop = core.onFormReset(node.ownerDocument, () => associated(anchor()), restore);
  });
  onUnmounted(() => stop?.());
}

/** The two copies of a control's value that a form reset needs. */
export interface ResettableValue<T> {
  /**
   * What the composable is told. It follows the prop and the control's own
   * reports (the caller writes those back); a reset writes the default straight
   * into it, which is the composable's silent path (its watch, not its setter).
   */
  told: Ref<T>;
  /**
   * The reset default. It follows the prop, except a give-back of what the
   * control itself reported (ADR 0012).
   */
  fallback: Ref<T>;
}

/**
 * The controlled value of a control that a form reset puts back. On reset the
 * default goes into `told`, then to `restore`: the control's own copy of the
 * value, which in Vue is the v-model binding. Not the change callback: a reset
 * is not a user change (ADR 0012).
 */
export function useResettableValue<T>(
  given: () => T,
  anchor: () => Element | null,
  restore: (value: T) => void,
  same: (a: T, b: T) => boolean = (a, b) => a === b,
): ResettableValue<T> {
  const told = ref(given()) as Ref<T>;
  const fallback = ref(given()) as Ref<T>;
  watch(given, (next) => {
    if (!same(next, told.value)) fallback.value = next;
    told.value = next;
  });
  useFormReset(anchor, () => {
    told.value = fallback.value;
    restore(fallback.value);
  });
  return { told, fallback };
}

/**
 * Write a control's DOM property when its state changes, and only then.
 *
 * The default travels as a forced attribute (`^value`, `^checked`), which
 * Vue patches without touching the property, so the value the user is editing
 * is the browser's own. Writing the property on every render instead would
 * collapse the selection to the end of the field on every keystroke.
 */
export function useLiveDom(
  element: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>,
  read: () => { value?: string; checked?: boolean },
): void {
  const apply = () => {
    const node = element.value;
    if (!node) return;
    const next = read();
    if (next.value !== undefined && node.value !== next.value) node.value = next.value;
    if (next.checked !== undefined && "checked" in node && node.checked !== next.checked) {
      (node as HTMLInputElement).checked = next.checked;
    }
  };
  // At mount too: the browser has already chosen a value of its own from the
  // markup (a select with nothing selected takes its first real option), and
  // the state is what the control means.
  onMounted(apply);
  watch(read, apply, { deep: true, flush: "post" });
}

/**
 * The same for a group of inputs: write each one's `checked` property when
 * the group's state changes. The defaults stay in the markup as forced
 * attributes, one per item, so a native reset has something to restore to.
 */
export function useLiveChecked(
  root: Ref<HTMLElement | null>,
  state: () => unknown,
  isChecked: (value: string) => boolean,
): void {
  const apply = () => {
    const node = root.value;
    if (!node) return;
    for (const input of node.querySelectorAll<HTMLInputElement>("input[value]")) {
      const next = isChecked(input.value);
      if (input.checked !== next) input.checked = next;
    }
  };
  onMounted(apply);
  watch(state, apply, { deep: true, flush: "post" });
}
