import { dialog as core } from "@design-system/core";
import { applyProps, boolAttr, emit, nextId } from "../internal/base";
import {
  createDialogHeader,
  syncDialogHeader,
  type DialogHeaderParts,
} from "../internal/dialog-header";
import { createButton, ModalHost } from "../internal/modal-host";

/**
 * `<ds-confirm-dialog>` asks the user to verify or accept before proceeding,
 * the accessible equivalent of `window.confirm()` (ADR 0005), on the native
 * `<dialog>` element.
 *
 * Cancel stops the process, confirm proceeds and emits `confirm` before the
 * dialog closes. Focus starts on the safe choice (Cancel). `urgent` switches
 * the panel to `role="alertdialog"` and changes nothing else. A child marked
 * `slot="icon"` becomes the leading icon of the header the dialog family
 * shares.
 *
 * Attributes: `heading` (required), `description`, `confirm-label` ("Confirm"
 * by default), `cancel-label` ("Cancel" by default), `confirm-variant`
 * (`primary` by default, `danger` for a destructive confirm), `urgent`,
 * `trigger` (opener text), `trigger-variant`, `open`, `close-button` (shows a
 * close button in the header), `close-label`, `no-outside-close`.
 * Properties: `open` (boolean).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`, and `confirm`
 * when the confirm button is pressed.
 */
export class DsConfirmDialog extends ModalHost {
  static observedAttributes = [
    "open",
    "heading",
    "description",
    "confirm-label",
    "cancel-label",
    "confirm-variant",
    "urgent",
    "trigger",
    "trigger-variant",
    "close-button",
    "close-label",
  ];

  protected readonly initialFocus = ".confirm-dialog__actions button";
  #header!: DialogHeaderParts;
  #description!: HTMLParagraphElement;
  #cancel!: HTMLButtonElement;
  #confirm!: HTMLButtonElement;
  #instanceId = nextId("ds-confirm-dialog");

  protected render() {
    const icon = this.takeSlot("icon");

    this.trigger = createButton();
    const panel = document.createElement("dialog");
    panel.className = "confirm-dialog__panel";

    this.#header = createDialogHeader({ icon });
    this.#description = document.createElement("p");
    this.#description.className = "confirm-dialog__description";

    const actions = document.createElement("footer");
    actions.className = "confirm-dialog__actions";
    this.#cancel = createButton("ghost");
    this.#cancel.addEventListener("click", () => this.setOpen(false));
    this.#confirm = createButton();
    this.#confirm.addEventListener("click", () => {
      emit(this, "confirm");
      this.setOpen(false);
    });
    actions.append(this.#cancel, this.#confirm);

    panel.append(this.#header.header, this.#description, actions);
    this.textContent = "";
    this.append(this.trigger);
    this.panel = panel;
  }

  protected sync() {
    const description = this.getAttribute("description");
    const api = core.connect({
      state: {
        open: this.open,
        id: this.id || this.#instanceId,
        role: boolAttr(this, "urgent") ? "alertdialog" : "dialog",
      },
      setOpen: this.setOpen,
      describedBy: description != null,
    });

    syncDialogHeader(this.#header, {
      heading: this.getAttribute("heading") ?? "",
      subtitle: null,
      closeButton: boolAttr(this, "close-button", false),
      closeLabel: this.getAttribute("close-label") ?? "Close",
    });
    this.#description.hidden = description == null;
    this.#description.textContent = description ?? "";
    this.#cancel.textContent = this.getAttribute("cancel-label") ?? "Cancel";
    this.#confirm.textContent = this.getAttribute("confirm-label") ?? "Confirm";
    this.#confirm.dataset.variant = this.getAttribute("confirm-variant") ?? "primary";
    this.trigger.textContent = this.getAttribute("trigger") ?? "Open";
    this.trigger.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.trigger, api.triggerProps);
    applyProps(this.panel!, api.contentProps);
    applyProps(this.#header.heading, api.titleProps);
    if (description != null) applyProps(this.#description, api.descriptionProps);
    else this.#description.removeAttribute("id");
    applyProps(this.#header.close, api.closeProps);

    this.syncModal();
  }
}
