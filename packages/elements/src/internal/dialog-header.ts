import { closeIcon } from "./icons";

/** Light-DOM children read from the host's `slot="…"` regions. */
export interface DialogHeaderRegions {
  icon?: Element[];
  lead?: Element[];
  meta?: Element[];
  actions?: Element[];
}

export interface DialogHeaderParts {
  header: HTMLElement;
  heading: HTMLHeadingElement;
  subtitle: HTMLParagraphElement;
  close: HTMLButtonElement;
}

const region = (className: string, children: Element[] = []) => {
  if (children.length === 0) return null;
  const node = document.createElement("div");
  node.className = className;
  node.append(...children);
  return node;
};

/**
 * Build the header every dialog in the family shares (internal), ported from
 * the Svelte adapter's DialogHeader with identical classes: optional icon and
 * leading button, the title block (meta, title, subtitle), optional actions
 * and the close button. The regions are fixed when the element renders; the
 * texts and visibility follow the host through `syncDialogHeader`.
 */
export function createDialogHeader(regions: DialogHeaderRegions): DialogHeaderParts {
  const header = document.createElement("header");
  header.className = "dialog-header";

  const heading = document.createElement("h2");
  heading.className = "dialog-header__title";

  const subtitle = document.createElement("p");
  subtitle.className = "dialog-header__subtitle";
  subtitle.hidden = true;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "dialog-header__close";
  close.innerHTML = closeIcon();

  const parts = [
    region("dialog-header__icon", regions.icon),
    region("dialog-header__lead", regions.lead),
    // The metadata precedes the title, as in the other adapters.
    region("dialog-header__meta", regions.meta),
    heading,
    subtitle,
    region("dialog-header__actions", regions.actions),
    close,
  ];
  for (const part of parts) if (part) header.append(part);

  return { header, heading, subtitle, close };
}

export interface DialogHeaderState {
  heading: string;
  subtitle: string | null;
  closeButton: boolean;
  closeLabel: string;
}

/** Reflect the host's current texts and flags onto the header parts. */
export function syncDialogHeader(parts: DialogHeaderParts, state: DialogHeaderState): void {
  parts.heading.textContent = state.heading;
  parts.subtitle.hidden = state.subtitle == null;
  parts.subtitle.textContent = state.subtitle ?? "";
  parts.close.hidden = !state.closeButton;
  parts.close.setAttribute("aria-label", state.closeLabel);
}
