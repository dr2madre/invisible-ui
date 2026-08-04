import { defineComponent, h, type ComponentPublicInstance, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { useDialog } from "../dialog/use-dialog";

export interface ConfirmDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title naming the confirmation (required). */
  title: string;
  /** Optional supporting message. */
  description?: string;
  /**
   * Label of the confirming button. Defaults to the catalog's "Confirm";
   * prefer naming the outcome ("Delete file").
   */
  confirmLabel?: string;
  /**
   * Label of the cancelling button (also the Escape action). Defaults to the
   * catalog's "Cancel"; prefer naming the outcome ("Keep file").
   */
  cancelLabel?: string;
  /** Variant of the confirm button (`"danger"` for a destructive confirm). */
  confirmVariant?: ButtonVariant;
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  urgent?: boolean;
  /** Called when the confirm button is pressed (before the dialog closes). */
  onConfirm?: () => void;
  /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * ConfirmDialog: a styled modal to verify or accept before proceeding, the
 * accessible equivalent of `window.confirm()` (a platform "simple dialog",
 * per ADR 0005). It reuses the headless dialog (`@design-system/core`) and
 * the shared modal composable (`useDialog`): native `<dialog>` +
 * `showModal()`, scroll lock. Cancel stops the process, confirm proceeds; the
 * safe choice (Cancel) is focused first. Set `urgent` when the choice must
 * interrupt (`role="alertdialog"`); for a message with nothing to cancel use
 * `AlertDialog`, to ask for a value use `PromptDialog`.
 *
 * The `trigger` prop/slot is the trigger. `onConfirm` runs when the confirm
 * button is pressed. A `title` is required; `description` is optional.
 * Colors, radius and elevation are themeable via `--ds-dialog-*`.
 */
export const ConfirmDialog = defineComponent({
  name: "ConfirmDialog",
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    confirmLabel: { type: String, default: undefined },
    cancelLabel: { type: String, default: undefined },
    confirmVariant: { type: String as PropType<ButtonVariant>, default: "primary" },
    urgent: { type: Boolean, default: false },
    onConfirm: { type: Function as PropType<() => void>, default: undefined },
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
      role: props.urgent ? "alertdialog" : "dialog",
      describedBy: props.description !== undefined,
      closeOnOutsideClick: props.closeOnOutsideClick,
      // Focus the safe choice (Cancel) first.
      initialFocus: ".confirm-dialog__actions button",
      onOpenChange: (next: boolean) => {
        emit("update:open", next);
        props.onOpenChange?.(next);
      },
    }));

    // A template ref on a component yields its instance; the composable wants
    // the DOM node it renders, to restore focus to it on close.
    const setTriggerRef = (el: Element | ComponentPublicInstance | null) => {
      const node = el && "$el" in el ? (el.$el as Element) : el;
      triggerRef.value = node instanceof HTMLElement ? node : null;
    };

    const cancel = () => setOpen(false);
    const confirm = () => {
      props.onConfirm?.();
      setOpen(false);
    };

    return () => {
      const { t } = i18n.value;
      const resolvedConfirmLabel = props.confirmLabel ?? t("dialog.confirm");
      const resolvedCancelLabel = props.cancelLabel ?? t("dialog.cancel");

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? t("dialog.trigger") },
      );

      if (!open.value) return [triggerNode, null];

      return [
        triggerNode,
        h("dialog", { ...api.value.contentProps, ref: panelRef, class: "confirm-dialog__panel" }, [
          h("h2", { ...api.value.titleProps, class: "confirm-dialog__title" }, props.title),
          props.description !== undefined
            ? h(
                "p",
                { ...api.value.descriptionProps, class: "confirm-dialog__description" },
                props.description,
              )
            : null,
          h("footer", { class: "confirm-dialog__actions" }, [
            h(
              Button,
              { variant: "ghost", onPress: cancel },
              { default: () => resolvedCancelLabel },
            ),
            h(
              Button,
              { variant: props.confirmVariant, onPress: confirm },
              { default: () => resolvedConfirmLabel },
            ),
          ]),
        ]),
      ];
    };
  },
});
