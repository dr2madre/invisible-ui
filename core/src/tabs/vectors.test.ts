import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";
import type { ActivationMode, Orientation, TabItem } from "./types";
import vectors from "./__vectors__/tabs.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

const items = vectors.items as TabItem[];

describe("tabs keyboard vectors", () => {
  for (const vector of vectors.keys) {
    it(vector.name, () => {
      let focused: string | null = null;
      let selected: string | null = null;
      const api = connect({
        state: initialState({
          items,
          orientation: vector.orientation as Orientation | undefined,
          activationMode: vector.activationMode as ActivationMode | undefined,
        }),
        setValue: (value) => (selected = value),
        focus: (value) => (focused = value),
        direction: vector.direction as "ltr" | "rtl" | undefined,
      });
      const onKeyDown = api.getTabProps(vector.from).onKeyDown as (event: Event) => void;
      onKeyDown({ key: vector.key, preventDefault: () => {} } as unknown as Event);
      expect({ focus: focused, select: selected }).toEqual({
        focus: vector.focus,
        select: vector.select,
      });
    });
  }
});
