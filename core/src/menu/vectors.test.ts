import { describe, expect, it } from "vitest";
import {
  GRACE_BLEED,
  isInGraceArea,
  placeSubmenu,
  type Point,
  type Rect,
  type Side,
  type Size,
} from "./index";
import { connect } from "./connect";
import { matchItem } from "./state";
import { entriesAt } from "./tree";
import type { MenuEntry, MenuState } from "./types";
import graceVectors from "./__vectors__/menu-grace-area.json";
import keyboardVectors from "./__vectors__/menu-keyboard.json";
import placementVectors from "./__vectors__/menu-placement.json";
import treeVectors from "./__vectors__/menu-tree.json";
import typeaheadVectors from "./__vectors__/menu-typeahead.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// files, so both implementations answer the same cases.
const tree = treeVectors.tree as MenuEntry[];

describe("menu keyboard vectors", () => {
  for (const vector of keyboardVectors.cases) {
    it(vector.name, () => {
      let state: MenuState = {
        open: true,
        activeValue: vector.activeValue,
        items: tree,
        disabled: false,
        id: "m",
        openPath: vector.openPath,
      };
      const reported: string[] = [];
      const wire = () =>
        connect({
          state,
          setOpen: (open) => (state = { ...state, open }),
          setActiveValue: (activeValue) => (state = { ...state, activeValue }),
          setOpenPath: (openPath) => (state = { ...state, openPath }),
          onSelect: (value) => reported.push(value),
          direction: vector.direction as "ltr" | "rtl",
        });

      let handled = false;
      const event = { key: vector.key, preventDefault: () => (handled = true) };
      (wire().menuProps.onKeyDown as (e: unknown) => void)(event);

      const after = wire();
      expect({
        open: after.open,
        openPath: after.openPath,
        activeValue: after.activeValue,
        reported,
        handled,
      }).toEqual(vector.expect);
    });
  }
});

describe("menu typeahead vectors", () => {
  for (const vector of typeaheadVectors.cases) {
    it(vector.name, () => {
      expect(matchItem(entriesAt(tree, vector.path), vector.query, vector.from)).toBe(
        vector.expect,
      );
    });
  }
});

describe("menu grace area vectors", () => {
  it("uses the bleed the vectors assume", () => {
    expect(GRACE_BLEED).toBe(graceVectors.bleed);
  });

  for (const vector of graceVectors.cases) {
    it(vector.name, () => {
      const { point, exit, submenu, side } = vector as {
        point: Point;
        exit: Point;
        submenu: Rect;
        side: Side;
      };
      expect(isInGraceArea(point, exit, submenu, side)).toBe(vector.inside);
    });
  }
});

describe("menu placement vectors", () => {
  for (const vector of placementVectors.cases) {
    it(vector.name, () => {
      const { anchor, menu, viewport, direction } = vector as {
        anchor: Rect;
        menu: Size;
        viewport: Size;
        direction: "ltr" | "rtl";
      };
      expect(
        placeSubmenu({ anchor, menu, viewport, direction, padding: placementVectors.padding }),
      ).toEqual(vector.expect);
    });
  }
});
