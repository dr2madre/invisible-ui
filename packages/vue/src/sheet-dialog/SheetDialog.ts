import { defineComponent, h, type ComponentPublicInstance, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { dialogHeader } from "../dialog/dialog-header";
import { useI18n } from "../i18n/i18n";
import { useSheetDialog, type SheetDialogSide } from "./use-sheet-dialog";

export interface SheetDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  /** Which edge the panel is anchored to. */
  side?: SheetDialogSide;
  /**
   * Show a grab handle and enable the drag-to-dismiss gesture. Available on the
   * bottom and lateral sides (ignored on `side="top"`).
   */
  draggable?: boolean;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title naming the panel (required). */
  title: string;
  /** Optional description, wired via `aria-describedby`. */
  description?: string;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Show the close button at the trailing end of the header. Default `true`. */
  closeButton?: boolean;
  /**
   * CSS selector (within the panel) for the element to focus on open, e.g.
   * `"input"` to land on a form's first field instead of the close button.
   */
  initialFocus?: string;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * SheetDialog — a Dialog anchored to an edge of the viewport (the panel pattern
 * variously marketed as "sheet", "side panel" or "drawer"), ported from the
 * Svelte adapter. It is a dialog in every sense: it reuses the headless dialog
 * (`@design-system/core`) and the shared modal composable unchanged, so it
 * keeps the native `<dialog>` plus `showModal()` (top layer, inert background),
 * scroll lock, Escape / backdrop / close-button dismissal, and focus restore.
 *
 * Over `Dialog` it adds edge anchoring (`side`), a slide-in animation and an
 * optional drag-to-dismiss gesture (`draggable`, on the bottom and lateral
 * sides): a grab handle the user can drag past a distance or velocity threshold
 * to close; anything less snaps home. The handle is a pointer affordance, so
 * keyboard users close with Escape or the close button.
 *
 * Slots: `trigger` (the trigger button's content), the default slot (the body),
 * an optional `footer` (actions), and the header slots the dialog family
 * shares: `icon` (a leading FeedbackIcon), `headerLead` (before the title, e.g.
 * a back affordance) and `headerActions` (after the title, just before the
 * close button). Pass a `title` (required) and an optional `description`,
 * shown as the subtitle under the title. Colors, radius and elevation are themeable via
 * `--ds-dialog-*`; the panel extent via `--ds-sheet-dialog-size`.
 */
export const SheetDialog = defineComponent({
  name: "SheetDialog",
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    side: { type: String as PropType<SheetDialogSide>, default: "right" },
    draggable: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    closeLabel: { type: String, default: undefined },
    closeButton: { type: Boolean, default: true },
    initialFocus: { type: String, default: undefined },
    /**
     * Whether this component renders its own trigger button. Turn it off when
     * the button belongs somewhere this panel cannot reach, an application
     * header for instance: drive `open` yourself and name `returnFocusTo`,
     * since there is no trigger left for focus to go back to (ADR 0013).
     */
    renderTrigger: { type: Boolean, default: true },
    /** CSS selector for the element focus returns to when there is no trigger. */
    returnFocusTo: { type: String, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();

    const { api, open, triggerRef, panelRef, dragOffset, dragging, onHandlePointerDown } =
      useSheetDialog(() => ({
        open: props.open,
        side: props.side,
        describedBy: props.description !== undefined,
        initialFocus: props.initialFocus,
        returnFocusTo: props.returnFocusTo,
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

    /** The panel's live transform while a drag is in flight (none at rest). */
    const dragTransform = () => {
      const offset = dragOffset.value;
      if (offset === 0) return undefined;
      if (props.side === "bottom") return `translateY(${offset}px)`;
      if (props.side === "right") return `translateX(${offset}px)`;
      if (props.side === "left") return `translateX(${-offset}px)`;
      return undefined;
    };

    return () => {
      const { t } = i18n.value;
      const resolvedCloseLabel = props.closeLabel ?? t("sheetDialog.close");
      const hasHandle = props.draggable && props.side !== "top";

      const triggerNode = props.renderTrigger
        ? h(
            Button,
            { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
            { default: () => slots.trigger?.() ?? props.trigger ?? t("dialog.trigger") },
          )
        : null;

      if (!open.value) return [triggerNode, null];

      const panel = h(
        "dialog",
        {
          ...api.value.contentProps,
          ref: panelRef,
          class: ["sheet-dialog__panel", { "sheet-dialog__panel--dragging": dragging.value }],
          "data-side": props.side,
          style: { transform: dragTransform() },
        },
        [
          hasHandle
            ? h("div", {
                class: "sheet-dialog__handle",
                "aria-hidden": "true",
                onPointerdown: onHandlePointerDown,
              })
            : null,

          dialogHeader({
            title: props.title,
            subtitle: props.description,
            closeButton: props.closeButton,
            closeLabel: resolvedCloseLabel,
            titleProps: api.value.titleProps,
            subtitleProps: api.value.descriptionProps,
            closeProps: api.value.closeProps,
            icon: slots.icon?.(),
            lead: slots.headerLead?.(),
            actions: slots.headerActions?.(),
          }),
          h("div", { class: "sheet-dialog__body" }, slots.default?.()),

          slots.footer ? h("footer", { class: "sheet-dialog__footer" }, slots.footer()) : null,
        ],
      );

      return [triggerNode, panel];
    };
  },
});
