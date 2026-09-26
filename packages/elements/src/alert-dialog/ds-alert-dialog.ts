import { dialog as core } from "@design-system/core";
import { applyProps, boolAttr, emit, nextId } from "../internal/base";
import {
  createDialogHeader,
  syncDialogHeader,
  type DialogHeaderParts,
} from "../internal/dialog-header";
import { createButton, ModalHost } from "../internal/modal-host";
import { localized } from "../internal/i18n";

/**
 * `<ds-alert-dialog>` is a modal acknowledgement, the accessible equivalent of
 * `window.alert()` (ADR 0005), on the native `<dialog>` element.
 *
 * The panel is `role="alertdialog"`, so screen readers announce it at once.
 * One button takes note and closes; Escape and a backdrop press do the same,
 * and each of the three emits `dismiss`. Focus starts on that button. A child
 * marked `slot="icon"` becomes the leading icon of the header the dialog
 * family shares.
 *
 * Attributes: `heading` (required), `description` (required), `dismiss-label`
 * (the button, "OK" by default), `trigger` (opener text), `trigger-variant`,
 * `open`, `close-button` (shows a close button in the header), `close-label`,
 * `no-outside-close`.
 * Properties: `open` (boolean).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`, and `dismiss`
 * when the alert is acknowledged.
 */
export class DsAlertDialog extends ModalHost {
  static observedAttributes = [
    "open",
    "heading",
    "description",
    "dismiss-label",
    "trigger",
    "trigger-variant",
    "close-button",
    "close-label",
  ];

  protected readonly initialFocus = ".alert-dialog__actions button";
  #header!: DialogHeaderParts;
  #description!: HTMLParagraphElement;
  #dismiss!: HTMLButtonElement;
  #instanceId = nextId("ds-alert-dialog");

  protected override didChangeOpen(open: boolean) {
    // Every way of closing an acknowledgement is the acknowledgement.
    if (!open) emit(this, "dismiss");
  }

  protected render() {
    const icon = this.takeSlot("icon");

    this.trigger = createButton();
    const panel = document.createElement("dialog");
    panel.className = "alert-dialog__panel";

    this.#header = createDialogHeader({ icon });
    this.#description = document.createElement("p");
    this.#description.className = "alert-dialog__description";

    const actions = document.createElement("footer");
    actions.className = "alert-dialog__actions";
    this.#dismiss = createButton("primary");
    this.#dismiss.addEventListener("click", () => this.setOpen(false));
    actions.append(this.#dismiss);

    panel.append(this.#header.header, this.#description, actions);
    this.textContent = "";
    this.append(this.trigger);
    this.panel = panel;
  }

  protected sync() {
    const api = core.connect({
      state: { open: this.open, id: this.id || this.#instanceId, role: "alertdialog" },
      setOpen: this.setOpen,
      describedBy: true,
    });

    syncDialogHeader(this.#header, {
      heading: this.getAttribute("heading") ?? "",
      subtitle: null,
      closeButton: boolAttr(this, "close-button", false),
      closeLabel: localized(this, "close-label", "dialog.close"),
    });
    this.#description.textContent = this.getAttribute("description") ?? "";
    this.#dismiss.textContent = localized(this, "dismiss-label", "dialog.dismiss");
    this.trigger.textContent = localized(this, "trigger", "dialog.trigger");
    this.trigger.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.trigger, api.triggerProps);
    applyProps(this.panel!, api.contentProps);
    applyProps(this.#header.heading, api.titleProps);
    applyProps(this.#description, api.descriptionProps);
    applyProps(this.#header.close, api.closeProps);

    this.syncModal();
  }
}
