import { uploadDropArea } from "@invisible-ui/core";
import {
  boolAttr,
  definePart,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { onLocaleChange, t } from "../internal/i18n";
import { hazardIcon } from "../internal/icons";
import { DsLoading } from "../loading/ds-loading";

/** A file the area left out, and why: `type` (not in `accept`) or `count`. */
export type UploadRejection = uploadDropArea.UploadRejection;

/** No-flash delay before the picker spinner appears, in ms. */
const PICKER_SPINNER_DELAY = 150;

const UPLOAD_ICON =
  '<svg viewBox="0 0 24 24" width="2em" height="2em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>';

/**
 * `<ds-upload-drop-area>` is a drag-and-drop file area with a click-to-browse
 * fallback.
 *
 * Light DOM: a real `<input type="file">` sits inside a `<label>`, so the
 * browser owns file selection, keyboard operation (Tab to the input, Enter or
 * Space opens the picker) and form participation. Dragging files over the
 * area sets `data-dragover`; dropped files become the input's file list, so
 * they submit with the form and a reset clears them. Picked and dropped
 * files go through the same `accept` filter, and a single-file area takes
 * the first file that passes it; the files left out are named in an alert
 * under the area and reported in a `reject` event. The filter is a
 * convenience: the page still validates the files it receives.
 *
 * Unslotted children replace the default prompt. A child with `slot="icon"`
 * replaces the upload glyph. While the picker opens, a `<ds-loading>` spinner
 * shows; the element registers it when the page has not.
 *
 * Attributes: `accept`, `multiple`, `disabled`, `name`, `caption`.
 * Properties: `files` (read-only), `disabled`.
 * Emits: bubbling `files` CustomEvent with `detail.files` (a `File[]`) when
 * files are picked or dropped and the area takes some; bubbling `reject`
 * CustomEvent with `detail.rejected` (`{ file, reason }[]`, reason `type` or
 * `count`) for the files it leaves out.
 */
export class DsUploadDropArea extends HTMLElementBase {
  static observedAttributes = ["accept", "multiple", "disabled", "name", "caption"];

  #root: HTMLLabelElement | null = null;
  #input: HTMLInputElement | null = null;
  #caption: HTMLSpanElement | null = null;
  #spinner: HTMLElement | null = null;
  #opening = false;
  #prompt: Text | null = null;
  #action: HTMLSpanElement | null = null;
  #rejectedId = `${nextId("ds-upload-drop-area")}-rejected`;
  #rejected: HTMLDivElement | null = null;
  #rejection: UploadRejection[] = [];

  constructor() {
    super();
    onLocaleChange(this, () => this.#localize());
  }

  connectedCallback() {
    upgradeProperty(this, "disabled");
    if (!this.#root) this.#render();
    this.#sync();
  }

  disconnectedCallback() {
    // A picker left open when the area goes away must not leave its window
    // listener behind.
    this.#resolveOpen();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get disabled(): boolean {
    return boolAttr(this, "disabled");
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  /** The files the input currently holds. */
  get files(): File[] {
    return Array.from(this.#input?.files ?? []);
  }

  #render() {
    let icon: Element | null = null;
    const content: Node[] = [];
    for (const node of Array.from(this.childNodes)) {
      if (node instanceof Element && node.getAttribute("slot") === "icon") {
        node.removeAttribute("slot");
        icon = node;
      } else if (node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()) {
        content.push(node);
      }
    }
    this.textContent = "";

    const root = document.createElement("label");
    root.className = "upload-drop-area";
    root.addEventListener("dragover", (event) => {
      if (this.disabled) return;
      event.preventDefault();
      root.toggleAttribute("data-dragover", true);
    });
    root.addEventListener("dragleave", () => root.removeAttribute("data-dragover"));
    root.addEventListener("drop", (event) => {
      event.preventDefault();
      root.removeAttribute("data-dragover");
      if (this.disabled || !event.dataTransfer) return;
      this.#take(Array.from(event.dataTransfer.files), true);
    });

    const input = document.createElement("input");
    input.className = "upload-drop-area__input";
    input.type = "file";
    input.addEventListener("click", () => this.#onOpen());
    input.addEventListener("cancel", () => this.#resolveOpen());
    input.addEventListener("change", (event) => {
      // The host reports a typed `files` event; the native one stays inside.
      event.stopPropagation();
      this.#resolveOpen();
      const files = Array.from(input.files ?? []);
      if (files.length > 0) this.#take(files, false);
    });
    input.addEventListener("input", (event) => event.stopPropagation());

    const iconWrap = document.createElement("span");
    iconWrap.className = "upload-drop-area__icon";
    iconWrap.setAttribute("aria-hidden", "true");
    if (icon) iconWrap.appendChild(icon);
    else iconWrap.innerHTML = UPLOAD_ICON;

    const text = document.createElement("span");
    text.className = "upload-drop-area__text";
    if (content.length) {
      text.append(...content);
    } else {
      // Link-like affordance only: the label and its input are the real
      // control, so the action word stays a plain span.
      const action = document.createElement("span");
      action.className = "upload-drop-area__action";
      this.#prompt = document.createTextNode("");
      this.#action = action;
      text.append(this.#prompt, action);
    }

    root.append(input, iconWrap, text);
    this.appendChild(root);
    this.#root = root;
    this.#input = input;
    this.#localize();
  }

  #localize() {
    if (this.#prompt) this.#prompt.data = `${t(this, "uploadDropArea.prompt")} `;
    if (this.#action) this.#action.textContent = t(this, "uploadDropArea.action");
    for (const [index, paragraph] of Array.from(this.#rejected?.children ?? []).entries()) {
      const { file, reason } = this.#rejection[index]!;
      paragraph.lastChild!.textContent = this.#rejectionText(file, reason);
    }
  }

  #rejectionText(file: File, reason: uploadDropArea.UploadRejectReason) {
    const key = reason === "type" ? "uploadDropArea.rejectedType" : "uploadDropArea.rejectedCount";
    return t(this, key, { name: file.name });
  }

  /**
   * Name the files left out, after the area: outside the label, so it never
   * joins the input's name. A new element each time, so the same rejection
   * twice is announced again; the hazard glyph keeps it off color alone.
   */
  #showRejected(rejected: UploadRejection[]) {
    this.#rejection = rejected;
    this.#rejected?.remove();
    this.#rejected = null;
    const input = this.#input!;
    if (rejected.length === 0) {
      input.removeAttribute("aria-describedby");
      return;
    }
    const box = document.createElement("div");
    box.id = this.#rejectedId;
    box.className = "upload-drop-area__rejected";
    box.setAttribute("role", "alert");
    for (const { file, reason } of rejected) {
      const paragraph = document.createElement("p");
      paragraph.className = "field__error field__message";
      const glyph = document.createElement("span");
      glyph.className = "field__msg-icon";
      glyph.setAttribute("aria-hidden", "true");
      glyph.innerHTML = hazardIcon();
      paragraph.append(glyph, document.createTextNode(this.#rejectionText(file, reason)));
      box.appendChild(paragraph);
    }
    this.#root!.after(box);
    this.#rejected = box;
    input.setAttribute("aria-describedby", this.#rejectedId);
  }

  #sync() {
    const root = this.#root!;
    const input = this.#input!;
    const disabled = this.disabled;
    root.classList.toggle("upload-drop-area--disabled", disabled);
    if (disabled) root.removeAttribute("data-dragover");
    input.disabled = disabled;
    input.multiple = boolAttr(this, "multiple");
    for (const attr of ["accept", "name"] as const) {
      const value = this.getAttribute(attr);
      if (value != null) input.setAttribute(attr, value);
      else input.removeAttribute(attr);
    }

    const caption = this.getAttribute("caption");
    if (caption) {
      this.#caption ??= document.createElement("span");
      this.#caption.className = "upload-drop-area__caption";
      this.#caption.textContent = caption;
      root.insertBefore(this.#caption, this.#spinner);
    } else {
      this.#caption?.remove();
      this.#caption = null;
    }
  }

  // Picked and dropped files go through the same filter. The input holds the
  // files the area takes, so they submit and a form reset clears them; a drop
  // with none to take leaves the input as it was.
  #take(files: File[], dropped: boolean) {
    const input = this.#input!;
    const { accepted, rejected } = uploadDropArea.splitFiles(files, {
      accept: this.getAttribute("accept"),
      multiple: input.multiple,
    });
    if (dropped ? accepted.length > 0 : rejected.length > 0) {
      if (accepted.length === 0) input.value = "";
      else if (typeof DataTransfer !== "undefined") {
        const transfer = new DataTransfer();
        for (const file of accepted) transfer.items.add(file);
        input.files = transfer.files;
      }
    }
    this.#showRejected(rejected);
    if (rejected.length > 0) emit(this, "reject", { rejected });
    if (accepted.length > 0) emit(this, "files", { files: accepted });
  }

  // The native file dialog can take up to a second to appear, so a spinner
  // covers that gap. It clears when the window regains focus (the dialog
  // closed) or when a file is chosen or the pick is cancelled.
  #onOpen() {
    if (this.disabled || this.#opening) return;
    this.#setOpening(true);
    window.addEventListener("focus", this.#resolveOpen, { once: true });
  }

  #resolveOpen = () => {
    if (typeof window !== "undefined") window.removeEventListener("focus", this.#resolveOpen);
    this.#setOpening(false);
  };

  #setOpening(opening: boolean) {
    this.#opening = opening;
    const root = this.#root;
    if (!root) return;
    root.classList.toggle("upload-drop-area--opening", opening);
    if (opening) root.setAttribute("aria-busy", "true");
    else root.removeAttribute("aria-busy");
    if (opening && !this.#spinner) {
      // No veil: the OS dialog is already modal.
      definePart("ds-loading", DsLoading);
      const spinner = document.createElement("ds-loading");
      spinner.setAttribute("variant", "spinner");
      spinner.setAttribute("overlay", "");
      spinner.setAttribute("veil", "false");
      spinner.setAttribute("delay", String(PICKER_SPINNER_DELAY));
      spinner.setAttribute("decorative", "");
      root.appendChild(spinner);
      this.#spinner = spinner;
    } else if (!opening) {
      this.#spinner?.remove();
      this.#spinner = null;
    }
  }
}
