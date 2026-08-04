import { defineComponent, h, type ComponentPublicInstance, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { useDialog } from "../dialog/use-dialog";

export interface AlertDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title naming the alert (required). */
  title: string;
  /** The message to acknowledge (required). */
  description: string;
  /**
   * Label of the single acknowledging button. Defaults to the catalog's "OK";
   * prefer naming the outcome in context ("Done", "Close", "I understood").
   */
  dismissLabel?: string;
  /** Called when the alert is acknowledged (button, Escape or backdrop). */
  onDismiss?: () => void;
  /**
   * Whether pressing the backdrop acknowledges and closes. Defaults to `true`;
   * set `false` to require an explicit button press (e.g. "I understood").
   */
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * AlertDialog: a styled modal acknowledgement, the accessible equivalent of
 * `window.alert()` (the platform's first "simple dialog", per ADR 0005). It
 * interrupts to communicate an important message (`role="alertdialog"`, so
 * screen readers announce it immediately), and there is nothing to cancel:
 * one button takes note and closes. Escape and a backdrop press are
 * equivalent to the button.
 *
 * It reuses the shared modal composable (`useDialog`): native `<dialog>` +
 * `showModal()`, scroll lock. A `title` and `description` are both required
 * (an alert must be named and described). The `trigger` prop/slot is the
 * trigger. `onDismiss` runs whenever the alert is acknowledged: button,
 * Escape or backdrop. For a choice that can stop a process use
 * `ConfirmDialog`; to ask for a value use `PromptDialog`. Colors, radius and
 * elevation are themeable via `--ds-dialog-*`.
 */
export const AlertDialog = defineComponent({
  name: "AlertDialog",
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dismissLabel: { type: String, default: undefined },
    onDismiss: { type: Function as PropType<() => void>, default: undefined },
    closeOnOutsideClick: { type: Boolean, default: true },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();

    const { api, open, setOpen, triggerRef, panelRef } = useDialog(() => ({
      open: props.open,
      role: "alertdialog",
      describedBy: true,
      closeOnOutsideClick: props.closeOnOutsideClick,
      // Focus the only action: taking note.
      initialFocus: ".alert-dialog__actions button",
      onOpenChange: (next: boolean) => {
        emit("update:open", next);
        props.onOpenChange?.(next);
        // Every way of closing an acknowledgement is the acknowledgement.
        if (!next) props.onDismiss?.();
      },
    }));

    // A template ref on a component yields its instance; the composable wants
    // the DOM node it renders, to restore focus to it on close.
    const setTriggerRef = (el: Element | ComponentPublicInstance | null) => {
      const node = el && "$el" in el ? (el.$el as Element) : el;
      triggerRef.value = node instanceof HTMLElement ? node : null;
    };

    return () => {
      const { t } = i18n.value;
      const resolvedDismissLabel = props.dismissLabel ?? t("dialog.dismiss");

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? t("dialog.trigger") },
      );

      if (!open.value) return [triggerNode, null];

      return [
        triggerNode,
        h("dialog", { ...api.value.contentProps, ref: panelRef, class: "alert-dialog__panel" }, [
          h("h2", { ...api.value.titleProps, class: "alert-dialog__title" }, props.title),
          h(
            "p",
            { ...api.value.descriptionProps, class: "alert-dialog__description" },
            props.description,
          ),
          h("footer", { class: "alert-dialog__actions" }, [
            h(
              Button,
              { variant: "primary", onPress: () => setOpen(false) },
              { default: () => resolvedDismissLabel },
            ),
          ]),
        ]),
      ];
    };
  },
});
