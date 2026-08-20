import { h, Teleport, type VNode } from "vue";
import type { I18nValue } from "../i18n/i18n";

/**
 * Teleporting moves an overlay out of the LocaleProvider wrapper, so the DOM
 * would fall back to the page's language and direction. This wrapper carries
 * the originating scope's `lang` and `dir` along; `display: contents` keeps
 * it out of layout.
 */
export function scopedTeleport(
  disabled: boolean,
  scope: I18nValue,
  /**
   * The element the overlay belongs to. A modal dialog paints in the browser's
   * top layer, above everything in the body, and makes the rest of the page
   * inert: an overlay opened from inside one has to stay in that same layer,
   * or it shows through but cannot be clicked. Pass `null` for a
   * viewport-level layer that never belongs to a dialog. The dialog does not
   * have to be open yet.
   */
  anchor: HTMLElement | null,
  children: (VNode | null)[],
) {
  const host = anchor?.closest("dialog") ?? null;
  return h(Teleport, { to: host ?? "body", disabled }, [
    h("div", { lang: scope.locale, dir: scope.dir, style: { display: "contents" } }, children),
  ]);
}
