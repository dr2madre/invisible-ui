import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";
import type { TreeNode } from "./types";
import vectors from "./__vectors__/tree-view.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

const nodes = vectors.nodes as TreeNode[];

interface Vector {
  name: string;
  from: string;
  key: string;
  direction?: string;
  initialExpanded?: string[];
  loading?: string[];
  loadErrors?: string[];
  disabled?: boolean;
  focus: string | null;
  expanded: string[] | null;
  select: string | null;
  load: string | null;
}

describe("tree view keyboard vectors", () => {
  for (const vector of vectors.keys as Vector[]) {
    it(vector.name, () => {
      let focus: string | null = null;
      let expanded: string[] | null = null;
      let select: string | null = null;
      let load: string | null = null;
      const api = connect({
        state: initialState({
          id: "vectors",
          nodes,
          expanded: vector.initialExpanded,
          loading: vector.loading,
          loadErrors: vector.loadErrors,
          disabled: vector.disabled,
        }),
        setExpanded: (next) => (expanded = next),
        setSelected: (value) => (select = value),
        setFocused: () => {},
        focus: (value) => (focus = value),
        requestLoad: (request) => (load = request.value),
        direction: vector.direction as "ltr" | "rtl" | undefined,
      });
      const onKeyDown = api.getItemProps(vector.from).onKeyDown as (event: Event) => void;
      onKeyDown({ key: vector.key, preventDefault: () => {} } as unknown as Event);
      expect({ focus, expanded, select, load }).toEqual({
        focus: vector.focus,
        expanded: vector.expanded,
        select: vector.select,
        load: vector.load,
      });
    });
  }
});
