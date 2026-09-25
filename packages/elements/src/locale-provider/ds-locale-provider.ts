import { i18n } from "@design-system/core";
import { HTMLElementBase, upgradeProperty } from "../internal/base";
import { localeScope, notifyLocaleChange, onLocaleChange } from "../internal/i18n";

/**
 * `<ds-locale-provider>` sets the locale, writing direction and message
 * overrides for every element inside it. It writes `lang` and `dir` on itself,
 * so assistive technologies use the right language rules and the CSS logical
 * properties flip for right-to-left text. Without `dir`, the direction follows
 * the locale. The closest provider wins; outside any provider an element reads
 * the closest `lang` attribute, then English. A label attribute set on an
 * element still wins over the catalog.
 *
 * ```html
 * <ds-locale-provider locale="it">
 *   <ds-dialog heading="Impostazioni"></ds-dialog>
 * </ds-locale-provider>
 * <script>
 *   document.querySelector("ds-locale-provider").messages = { "dialog.close": "Chiudi" };
 * </script>
 * ```
 *
 * Attributes: `locale` (BCP-47 tag; without it, the language around the
 * provider, then English), `dir` (`ltr` or `rtl`; derived from the locale when
 * omitted).
 * Properties: `locale` (the resolved tag), `messages` (overrides keyed by
 * catalog key: plain strings, or plural objects for count messages).
 */
export class DsLocaleProvider extends HTMLElementBase {
  static observedAttributes = ["locale", "dir"];

  #messages: i18n.Messages = {};
  #explicitDir: i18n.Dir | null = null;
  /**
   * The `dir` values this element wrote and has yet to see come back. Attribute
   * callbacks can run after the write returns (during an upgrade, or when the
   * write happens inside another callback), so a flag cannot tell them apart.
   */
  #ownDirWrites: string[] = [];

  constructor() {
    super();
    // A provider without `locale` follows the one around it.
    onLocaleChange(this, () => this.#update());
  }

  connectedCallback() {
    for (const property of ["locale", "messages"]) upgradeProperty(this, property);
    this.#update();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "dir") {
      if (this.#ownDirWrites[0] === value) {
        this.#ownDirWrites.shift();
        return;
      }
      this.#explicitDir = value === "ltr" || value === "rtl" ? value : null;
    }
    this.#update();
  }

  get locale(): string {
    const tag = this.getAttribute("locale");
    return tag ? i18n.canonicalLocale(tag) : localeScope(this).locale;
  }
  set locale(value: string) {
    if (value) this.setAttribute("locale", value);
    else this.removeAttribute("locale");
  }

  get messages(): i18n.Messages {
    return this.#messages;
  }
  set messages(value: i18n.Messages) {
    this.#messages = value && typeof value === "object" ? value : {};
    this.#update();
  }

  #update() {
    if (!this.isConnected) return;
    const locale = this.locale;
    this.setAttribute("lang", locale);
    const dir = this.#explicitDir ?? i18n.localeDirection(locale);
    if (this.getAttribute("dir") !== dir) {
      this.#ownDirWrites.push(dir);
      this.setAttribute("dir", dir);
    }
    notifyLocaleChange(this);
  }
}
