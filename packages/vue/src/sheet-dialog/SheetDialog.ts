import { defineComponent, h, type ComponentPublicInstance, type PropType } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
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
 * an optional `footer` (actions), and two header slots, `headerLead` (before
 * the title, on the leading edge, e.g. a back affordance) and `headerActions`
 * (after the title, just before the close button). Pass a `title` (required)
 * and optional `description`. Colors, radius and elevation are themeable via
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
    initialFocus: { type: String, default: undefined },
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

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? "Open" },
      );

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

          h("header", { class: "sheet-dialog__header" }, [
            // Content before the title (e.g. a back or up affordance), on the
            // leading edge of the header.
            slots.headerLead
              ? h("div", { class: "sheet-dialog__header-lead" }, slots.headerLead())
              : null,

            h("h2", { ...api.value.titleProps, class: "sheet-dialog__title" }, props.title),

            // Actions on the title row (e.g. a settings button, "Mark all
            // read"), sitting just before the close button.
            slots.headerActions
              ? h("div", { class: "sheet-dialog__header-actions" }, slots.headerActions())
              : null,

            h(
              "button",
              {
                ...api.value.closeProps,
                class: "sheet-dialog__close",
                type: "button",
                "aria-label": resolvedCloseLabel,
              },
              [
                h(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    width: "1em",
                    height: "1em",
                    "aria-hidden": "true",
                    focusable: "false",
                  },
                  [
                    h("path", {
                      d: "M6 6l12 12M18 6L6 18",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2",
                      "stroke-linecap": "round",
                    }),
                  ],
                ),
              ],
            ),
          ]),

          props.description !== undefined
            ? h(
                "p",
                { ...api.value.descriptionProps, class: "sheet-dialog__description" },
                props.description,
              )
            : null,

          h("div", { class: "sheet-dialog__body" }, slots.default?.()),

          slots.footer ? h("footer", { class: "sheet-dialog__footer" }, slots.footer()) : null,
        ],
      );

      return [triggerNode, panel];
    };
  },
});
