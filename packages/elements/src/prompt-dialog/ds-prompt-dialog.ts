import { dialog as core } from "@design-system/core";
import { applyProps, boolAttr, emit, nextId } from "../internal/base";
import {
  createDialogHeader,
  syncDialogHeader,
  type DialogHeaderParts,
} from "../internal/dialog-header";
import { createButton, ModalHost } from "../internal/modal-host";

/**
 * `<ds-prompt-dialog>` asks the user for a single value, the accessible
 * equivalent of `window.prompt()` (ADR 0005), on the native `<dialog>`
 * element: everything `<ds-confirm-dialog>` has, plus a labelled text input.
 *
 * The input is focused on open and seeded with `value` on each opening.
 * Confirming, by the button or Enter in the input, emits `confirm` with the
 * entered text before the dialog closes. The value is optional by default;
 * `required` keeps the confirm button disabled while it is blank, and
 * `confirm-value` keeps it disabled until the input matches that exact text
 * (type to confirm). `urgent` switches the panel to `role="alertdialog"`. A
 * child marked `slot="icon"` becomes the leading icon of the header the
 * dialog family shares.
 *
 * Attributes: `heading` (required), `label` (required),
 * `description`, `value` (the initial text), `placeholder`, `required`,
 * `confirm-value`, `confirm-label` ("Confirm" by default), `cancel-label`
 * ("Cancel" by default), `confirm-variant` (`primary` by default), `urgent`,
 * `trigger` (opener text), `trigger-variant`, `open`, `close-button` (shows a
 * close button in the header), `close-label`, `no-outside-close`.
 * Properties: `open` (boolean).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`, and `confirm`
 * with `detail.value` when the value is confirmed.
 */
export class DsPromptDialog extends ModalHost {
  static observedAttributes = [
    "open",
    "heading",
    "label",
    "description",
    "placeholder",
    "required",
    "confirm-value",
    "confirm-label",
    "cancel-label",
    "confirm-variant",
    "urgent",
    "trigger",
    "trigger-variant",
    "close-button",
    "close-label",
  ];

  protected readonly initialFocus = ".prompt-dialog__input";
  #header!: DialogHeaderParts;
  #description!: HTMLParagraphElement;
  #label!: HTMLSpanElement;
  #input!: HTMLInputElement;
  #cancel!: HTMLButtonElement;
  #confirm!: HTMLButtonElement;
  #instanceId = nextId("ds-prompt-dialog");

  #canConfirm(): boolean {
    const current = this.#input.value;
    const gate = this.getAttribute("confirm-value");
    if (gate != null) return current === gate;
    return !boolAttr(this, "required") || current.trim().length > 0;
  }

  #syncConfirm() {
    this.#confirm.disabled = !this.#canConfirm();
  }

  #submit() {
    if (!this.#canConfirm()) return;
    emit(this, "confirm", { value: this.#input.value });
    this.setOpen(false);
  }

  protected override willOpen() {
    this.#input.value = this.getAttribute("value") ?? "";
    this.#syncConfirm();
  }

  protected render() {
    const icon = this.takeSlot("icon");

    this.trigger = createButton();
    const panel = document.createElement("dialog");
    panel.className = "prompt-dialog__panel";

    this.#header = createDialogHeader({ icon });
    this.#description = document.createElement("p");
    this.#description.className = "prompt-dialog__description";

    // The wrapping label names the input without an id to wire.
    const field = document.createElement("label");
    field.className = "prompt-dialog__field";
    this.#label = document.createElement("span");
    this.#label.className = "prompt-dialog__label";
    this.#input = document.createElement("input");
    this.#input.className = "prompt-dialog__input";
    this.#input.type = "text";
    this.#input.autocomplete = "off";
    this.#input.addEventListener("input", () => this.#syncConfirm());
    this.#input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.#submit();
    });
    field.append(this.#label, this.#input);

    const actions = document.createElement("footer");
    actions.className = "prompt-dialog__actions";
    this.#cancel = createButton("ghost");
    this.#cancel.addEventListener("click", () => this.setOpen(false));
    this.#confirm = createButton();
    this.#confirm.addEventListener("click", () => this.#submit());
    actions.append(this.#cancel, this.#confirm);

    panel.append(this.#header.header, this.#description, field, actions);
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
    this.#label.textContent = this.getAttribute("label") ?? "";
    this.#input.placeholder = this.getAttribute("placeholder") ?? "";
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
    this.#syncConfirm();
  }
}
