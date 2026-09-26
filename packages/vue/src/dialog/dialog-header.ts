import { h, type VNode, type VNodeArrayChildren } from "vue";

type Props = Record<string, unknown>;

export interface DialogHeaderOptions {
  /** Title naming the dialog; always rendered, hidden visually on request. */
  title: string;
  hideTitle?: boolean;
  /** Optional subtitle under the title. */
  subtitle?: string;
  closeButton: boolean;
  /** Accessible name of the close button. */
  closeLabel: string;
  /** Wiring from the dialog's headless API. */
  titleProps: Props;
  subtitleProps?: Props;
  closeProps?: Props;
  /** Slot content; an absent part renders nothing. */
  icon?: VNodeArrayChildren;
  lead?: VNodeArrayChildren;
  meta?: VNodeArrayChildren;
  actions?: VNodeArrayChildren;
}

/**
 * The header every dialog in the family shares (internal), ported from the
 * Svelte adapter's DialogHeader with identical classes. When nothing in it is
 * visible (a hidden title and no close button), it takes no space and only
 * names the dialog.
 */
export function dialogHeader(options: DialogHeaderOptions): VNode {
  const { title, hideTitle = false, subtitle, closeButton, icon, lead, meta, actions } = options;
  const empty =
    hideTitle && !closeButton && subtitle === undefined && !icon && !lead && !meta && !actions;

  return h("header", { class: ["dialog-header", { "dialog-header--empty": empty }] }, [
    icon ? h("div", { class: "dialog-header__icon" }, icon) : null,
    lead ? h("div", { class: "dialog-header__lead" }, lead) : null,
    // Consumer content above the title, e.g. "Step 1 of 2". It carries no
    // progress semantics of its own.
    meta ? h("div", { class: "dialog-header__meta" }, meta) : null,
    h(
      "h2",
      {
        ...options.titleProps,
        class: ["dialog-header__title", { "dialog-header__title--hidden": hideTitle }],
      },
      title,
    ),
    subtitle !== undefined
      ? h("p", { ...options.subtitleProps, class: "dialog-header__subtitle" }, subtitle)
      : null,
    actions ? h("div", { class: "dialog-header__actions" }, actions) : null,
    closeButton
      ? h(
          "button",
          {
            ...options.closeProps,
            class: "dialog-header__close",
            type: "button",
            "aria-label": options.closeLabel,
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
        )
      : null,
  ]);
}
