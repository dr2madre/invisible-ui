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
   * The element the overlay belongs to. An overlay left in the body while a
   * modal dialog is open can be seen but not clicked, so it goes into the
   * dialog the control sits in. Pass `null` for a viewport-level layer that
   * never belongs to a dialog. The dialog does not have to be open yet.
   */
  anchor: HTMLElement | null,
  children: (VNode | null)[],
) {
  const host = anchor?.closest("dialog") ?? null;
  return h(Teleport, { to: host ?? "body", disabled }, [
    h("div", { lang: scope.locale, dir: scope.dir, style: { display: "contents" } }, children),
  ]);
}
