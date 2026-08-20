import { afterEach, describe, expect, it } from "vitest";
import { portal } from "./portal";

// The portal target decides which layer an overlay lives in. Outside a dialog
// it is the body (escaping ancestor overflow and stacking contexts); inside a
// dialog it is that dialog, because a modal dialog paints above the body and
// makes it inert.

const nodes: HTMLElement[] = [];
const el = (tag = "div") => {
  const node = document.createElement(tag);
  nodes.push(node);
  return node;
};

afterEach(() => {
  for (const node of nodes.splice(0)) node.remove();
});

describe("portal action", () => {
  it("moves a node to the body when no dialog encloses it", () => {
    const host = el();
    document.body.appendChild(host);
    const node = el();
    host.appendChild(node);

    const handle = portal(node);
    expect(node.parentElement).toBe(document.body);
    handle?.destroy?.();
    expect(node.parentElement).toBeNull();
  });

  it("keeps a node in the dialog that encloses it", () => {
    const dialog = el("dialog");
    document.body.appendChild(dialog);
    const inner = el();
    dialog.appendChild(inner);
    const node = el();
    inner.appendChild(node);

    // The dialog does not have to be open yet: the overlay is portalled while
    // the dialog's own content is still mounting.
    const handle = portal(node);
    expect(node.parentElement).toBe(dialog);
    handle?.destroy?.();
  });

  it("honors an explicit target over both defaults", () => {
    const dialog = el("dialog");
    document.body.appendChild(dialog);
    const node = el();
    dialog.appendChild(node);
    const target = el();
    document.body.appendChild(target);

    const handle = portal(node, target);
    expect(node.parentElement).toBe(target);
    handle?.destroy?.();
  });
});
