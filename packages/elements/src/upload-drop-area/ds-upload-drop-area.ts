import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";

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
 * they submit with the form and a reset clears them. A single-file area keeps
 * the first dropped file.
 *
 * Unslotted children replace the default prompt. A child with `slot="icon"`
 * replaces the upload glyph. The `ds-loading` element must be registered for
 * the picker spinner to show.
 *
 * Attributes: `accept`, `multiple`, `disabled`, `name`, `caption`.
 * Properties: `files` (read-only), `disabled`.
 * Emits: bubbling `files` CustomEvent with `detail.files` (a `File[]`) when
 * files are picked or dropped.
 */
export class DsUploadDropArea extends HTMLElementBase {
  static observedAttributes = ["accept", "multiple", "disabled", "name", "caption"];

  #root: HTMLLabelElement | null = null;
  #input: HTMLInputElement | null = null;
  #caption: HTMLSpanElement | null = null;
  #spinner: HTMLElement | null = null;
  #opening = false;

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
      this.#adopt(event.dataTransfer.files);
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
      this.#emitFiles(input.files);
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
      action.textContent = "browse";
      text.append("Drag & drop files or ", action);
    }

    root.append(input, iconWrap, text);
    this.appendChild(root);
    this.#root = root;
    this.#input = input;
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

  #emitFiles(list: FileList | null | undefined) {
    if (!list || !list.length) return;
    emit(this, "files", { files: Array.from(list) });
  }

  #adopt(dropped: FileList) {
    const input = this.#input!;
    if (typeof DataTransfer === "undefined") {
      this.#emitFiles(dropped);
      return;
    }
    const kept = new DataTransfer();
    for (const file of Array.from(dropped).slice(0, input.multiple ? undefined : 1)) {
      kept.items.add(file);
    }
    input.files = kept.files;
    this.#emitFiles(kept.files);
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
