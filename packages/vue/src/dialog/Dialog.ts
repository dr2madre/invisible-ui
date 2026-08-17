import { defineComponent, h, type ComponentPublicInstance, type PropType, type VNode } from "vue";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { useDialog } from "./use-dialog";

/** How the dialog body spaces its direct children. */
export type DialogBodyLayout = "plain" | "stack";

export interface DialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's label. The `trigger` slot replaces it with markup. */
  trigger?: string;
  /** Initial / controlled open state; bindable with `v-model:open`. */
  open?: boolean;
  /** Accessible title naming the dialog (required). */
  title: string;
  /**
   * Visually hide the title while keeping it as the dialog's accessible name.
   * The title text is always required; this only controls whether it is shown.
   */
  hideTitle?: boolean;
  /** Optional description, wired via `aria-describedby`. */
  description?: string;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Show a close/cancel button on the footer's leading edge. */
  footerClose?: boolean;
  /**
   * Body layout. `plain` (the default) leaves the body untouched. `stack`
   * spaces the direct children by `--ds-dialog-body-gap`, which saves a
   * workflow from inventing its own spacing between sections.
   */
  bodyLayout?: DialogBodyLayout;
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself, never on the close button.
   */
  initialFocus?: string;
  /** Whether pressing the backdrop closes. Default `true`. */
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog: a styled modal window (WAI-ARIA dialog pattern).
 *
 * Behaviour and accessibility come from the headless dialog
 * (`@design-system/core`); modality comes from the native `<dialog>` element
 * via `showModal()`: top layer, inert background, `::backdrop` (ADR 0005),
 * with body scroll lock, backdrop light-dismiss and focus management added by
 * the adapter.
 *
 * The open state binds two ways: `v-model:open` (the idiomatic Vue form) or the
 * `open` prop plus `onOpenChange`, matching the React adapter. The body is the
 * default slot; `trigger`, `icon`, `headerMeta`, `headerLead`, `footerLead` and
 * `footer` are named slots.
 *
 * Layout: a grid panel with a fixed header and footer and a scrolling body.
 * Themeable via `--ds-dialog-*`.
 *
 * Multi-step workflows are a composition, not a separate component: put the
 * step context in `headerMeta`, Back in `footerLead`, and keep the step state
 * in the application.
 */
export const Dialog = defineComponent({
  name: "Dialog",
  inheritAttrs: false,
  props: {
    triggerVariant: { type: String as PropType<ButtonVariant>, default: "default" },
    trigger: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    hideTitle: { type: Boolean, default: false },
    description: { type: String, default: undefined },
    closeLabel: { type: String, default: undefined },
    footerClose: { type: Boolean, default: false },
    bodyLayout: { type: String as PropType<DialogBodyLayout>, default: "plain" },
    initialFocus: { type: String, default: undefined },
    closeOnOutsideClick: { type: Boolean, default: true },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();

    const { api, open, triggerRef, panelRef } = useDialog(() => ({
      open: props.open,
      describedBy: props.description !== undefined,
      initialFocus: props.initialFocus,
      closeOnOutsideClick: props.closeOnOutsideClick,
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

    return () => {
      const { t } = i18n.value;
      const resolvedCloseLabel = props.closeLabel ?? t("dialog.close");

      const triggerNode = h(
        Button,
        { variant: props.triggerVariant, ...api.value.triggerProps, ref: setTriggerRef },
        { default: () => slots.trigger?.() ?? props.trigger ?? t("dialog.trigger") },
      );

      if (!open.value) return [triggerNode, null];

      // One action bar: the leading group first, so source order matches focus
      // order, then the trailing group.
      const footerNodes: VNode[] = [];
      if (slots.footerLead || props.footerClose) {
        const leadNodes: VNode[] = [];
        if (slots.footerLead) leadNodes.push(...slots.footerLead());
        if (props.footerClose) {
          leadNodes.push(
            h(
              Button,
              { variant: "ghost", ...api.value.closeProps },
              { default: () => resolvedCloseLabel },
            ),
          );
        }
        footerNodes.push(h("div", { class: "dialog__footer-lead" }, leadNodes));
      }
      if (slots.footer) {
        footerNodes.push(h("div", { class: "dialog__footer-actions" }, slots.footer()));
      }

      const panel = h(
        "dialog",
        { ...api.value.contentProps, ref: panelRef, class: "dialog__panel" },
        [
          h("header", { class: "dialog__header" }, [
            slots.icon ? h("div", { class: "dialog__header-icon" }, slots.icon()) : null,
            slots.headerLead
              ? h("div", { class: "dialog__header-lead" }, slots.headerLead())
              : null,

            // Consumer content above the title, e.g. "Step 1 of 2". It carries
            // no progress semantics of its own.
            slots.headerMeta
              ? h("div", { class: "dialog__header-meta" }, slots.headerMeta())
              : null,

            h(
              "h2",
              {
                ...api.value.titleProps,
                class: props.hideTitle ? "dialog__title dialog__title--hidden" : "dialog__title",
              },
              props.title,
            ),

            props.description !== undefined
              ? h(
                  "p",
                  { ...api.value.descriptionProps, class: "dialog__subtitle" },
                  props.description,
                )
              : null,

            h(
              "button",
              {
                ...api.value.closeProps,
                class: "dialog__close",
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

          h("div", { class: "dialog__body", "data-layout": props.bodyLayout }, slots.default?.()),

          footerNodes.length > 0 ? h("footer", { class: "dialog__footer" }, footerNodes) : null,
        ],
      );

      return [triggerNode, panel];
    };
  },
});
