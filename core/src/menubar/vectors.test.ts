import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import type { MenubarMenuRef, MenubarState } from "./types";
import vectors from "./__vectors__/menubar-keyboard.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.
const menus = vectors.menus as MenubarMenuRef[];

describe("menubar vectors", () => {
  for (const vector of vectors.cases) {
    it(vector.name, () => {
      let state: MenubarState = {
        menus,
        focusedIndex: vector.focusedIndex,
        openIndex: vector.openIndex,
      };
      const log: string[] = [];
      const api = connect({
        state,
        setFocusedIndex: (focusedIndex) => (state = { ...state, focusedIndex }),
        openMenu: (index) => {
          log.push(`open:${index}`);
          state = { ...state, openIndex: index };
        },
        closeMenu: (index) => {
          log.push(`close:${index}`);
          state = { ...state, openIndex: -1 };
        },
        focusTrigger: (index) => log.push(`focus:${index}`),
        direction: vector.direction as "ltr" | "rtl" | undefined,
      });

      let handled = false;
      if (vector.event === "pointerEnter") {
        (api.getTriggerProps(vector.index!).onPointerEnter as () => void)();
      } else {
        (api.menubarProps.onKeyDown as (event: unknown) => void)({
          key: vector.event,
          defaultPrevented: vector.menuHandled ?? false,
          preventDefault: () => (handled = true),
        });
      }

      // The tab stop the bar reports, clamped as `focusedIndex` is.
      const focusedIndex = Math.max(0, Math.min(state.focusedIndex, menus.length - 1));
      expect({ focusedIndex, openIndex: state.openIndex, log }).toEqual({
        focusedIndex: vector.expected.focusedIndex,
        openIndex: vector.expected.openIndex,
        log: vector.expected.log,
      });
      if (vector.expected.handled !== undefined) expect(handled).toBe(vector.expected.handled);
    });
  }
});
