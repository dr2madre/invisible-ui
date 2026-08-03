import {
  computed,
  defineComponent,
  h,
  ref,
  watch,
  type ComponentPublicInstance,
  type PropType,
} from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { useDialog } from "../dialog/use-dialog";

export interface PromptDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title (required). */
  title: string;
  /** Optional supporting message shown under the title. */
  description?: string;
  /** Visible label for the input. */
  label: string;
  /** Initial value the input is seeded with on each open. */
  value?: string;
  placeholder?: string;
  /** Require a non-empty value: the confirm button stays disabled while blank. */
  required?: boolean;
  /**
   * Type-to-confirm: when set, the confirm button stays disabled until the
   * input matches this exact value, e.g. typing a file name to confirm its
   * deletion.
   */
  confirmValue?: string;
  /** Label of the confirming button; prefer naming the outcome ("Rename"). */
  confirmLabel?: string;
  /** Label of the cancelling button (also the Escape action). */
  cancelLabel?: string;
  /** Variant of the confirm button (`"danger"` for a destructive confirm). */
  confirmVariant?: ButtonVariant;
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  urgent?: boolean;
  /** Called with the entered value when confirmed (before the dialog closes). */
  onConfirm?: (value: string) => void;
  /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * PromptDialog: a styled modal that asks the user for a single value, the
 * accessible equivalent of `window.prompt()` (a platform "simple dialog", per
 * ADR 0005): everything ConfirmDialog has, plus an input. It reuses the
 * headless dialog (`@design-system/core`) and the shared modal composable
 * (`useDialog`): native `<dialog>` + `showModal()`, scroll lock. The text
 * input is focused on open. The value is optional by default; `required`
 * makes it mandatory, `confirmValue` turns it into a type-to-confirm gate,
 * `urgent` switches to `role="alertdialog"` when the ask must interrupt.
 *
 * The `trigger` prop/slot is the trigger. `onConfirm(value)` runs with the
 * entered text when confirmed; Enter in the field also confirms. A `title` is
 * required; `label` names the input. Colors, radius and elevation are
 * themeable via `--ds-dialog-*`.
 */
export const PromptDialog = defineComponent({
  name: "PromptDialog",
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    label: { type: String, required: true },
    value: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
    confirmValue: { type: String, default: undefined },
    confirmLabel: { type: String, default: undefined },
    cancelLabel: { type: String, default: undefined },
    confirmVariant: { type: String as PropType<ButtonVariant>, default: "primary" },
    urgent: { type: Boolean, default: false },
    onConfirm: { type: Function as PropType<(value: string) => void>, default: undefined },
    closeOnOutsideClick: { type: Boolean, default: true },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    const current = ref(props.value);

    const { api, open, setOpen, triggerRef, panelRef } = useDialog(() => ({
      open: props.open,
      role: props.urgent ? "alertdialog" : "dialog",
      describedBy: props.description !== undefined,
      closeOnOutsideClick: props.closeOnOutsideClick,
      initialFocus: ".prompt-dialog__input",
      onOpenChange: (next: boolean) => {
        emit("update:open", next);
        props.onOpenChange?.(next);
      },
    }));

    // Reset to the initial value each time it (re)opens.
    watch(open, (isOpen) => {
      if (isOpen) current.value = props.value;
    });

    const canConfirm = computed(() =>
      props.confirmValue != null
        ? current.value === props.confirmValue
        : !props.required || current.value.trim().length > 0,
    );

    // A template ref on a component yields its instance; the composable wants
    // the DOM node it renders, to restore focus to it on close.
    const setTriggerRef = (el: Element | ComponentPublicInstance | null) => {
      const node = el && "$el" in el ? (el.$el as Element) : el;
      triggerRef.value = node instanceof HTMLElement ? node : null;
    };

    const cancel = () => {
      current.value = props.value;
      setOpen(false);
    };
    const confirm = () => {
      if (!canConfirm.value) return;
      props.onConfirm?.(current.value);
      setOpen(false);
    };
    const onInputKeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirm();
      }
    };

    return () => {
      const { t } = i18n.value;
      const resolvedConfirmLabel = props.confirmLabel ?? t("dialog.confirm");
      const resolvedCancelLabel = props.cancelLabel ?? t("dialog.cancel");

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? "Open" },
      );

      if (!open.value) return [triggerNode, null];

      return [
        triggerNode,
        h("dialog", { ...api.value.contentProps, ref: panelRef, class: "prompt-dialog__panel" }, [
          h("h2", { ...api.value.titleProps, class: "prompt-dialog__title" }, props.title),
          props.description !== undefined
            ? h(
                "p",
                { ...api.value.descriptionProps, class: "prompt-dialog__description" },
                props.description,
              )
            : null,
          h("label", { class: "prompt-dialog__field" }, [
            h("span", { class: "prompt-dialog__label" }, props.label),
            h("input", {
              class: "prompt-dialog__input",
              type: "text",
              autocomplete: "off",
              placeholder: props.placeholder,
              value: current.value,
              onInput: (event: Event) => {
                current.value = (event.target as HTMLInputElement).value;
              },
              onKeydown: onInputKeydown,
            }),
          ]),
          h("footer", { class: "prompt-dialog__actions" }, [
            h(
              Button,
              { variant: "ghost", onPress: cancel },
              { default: () => resolvedCancelLabel },
            ),
            h(
              Button,
              { variant: props.confirmVariant, disabled: !canConfirm.value, onPress: confirm },
              { default: () => resolvedConfirmLabel },
            ),
          ]),
        ]),
      ];
    };
  },
});
