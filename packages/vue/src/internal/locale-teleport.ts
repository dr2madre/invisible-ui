import { h, Teleport, type VNode } from "vue";
import type { I18nValue } from "../i18n/i18n";

/**
 * Teleporting moves an overlay out of the LocaleProvider wrapper, so the DOM
 * would fall back to the page's language and direction. This wrapper carries
 * the originating scope's `lang` and `dir` along; `display: contents` keeps
 * it out of layout.
 */
export function scopedTeleport(disabled: boolean, scope: I18nValue, children: (VNode | null)[]) {
  return h(Teleport, { to: "body", disabled }, [
    h("div", { lang: scope.locale, dir: scope.dir, style: { display: "contents" } }, children),
  ]);
}
