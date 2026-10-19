import { test } from "node:test";
import assert from "node:assert/strict";
import { generatedTarget, updateGeneratedBoard } from "../tools/figma-component-pilot/sync.js";

globalThis.figma = {
  loadFontAsync: async () => {},
  variables: { getVariableByIdAsync: async (id) => ({ id }) },
};

let nextId = 0;
function node(name, type = "FRAME", children = []) {
  return {
    id: String(++nextId),
    name,
    type,
    children,
    width: 100,
    height: 40,
    x: 0,
    y: 0,
    fills: [],
    layoutMode: "NONE",
    primaryAxisSizingMode: "AUTO",
    counterAxisSizingMode: "AUTO",
    layoutAlign: "INHERIT",
    layoutGrow: 0,
    resizeWithoutConstraints(width, height) {
      this.width = width;
      this.height = height;
    },
  };
}

function board() {
  return node("Board", "FRAME", [
    node("Card", "COMPONENT_SET", [
      node("Variant=Media, Orientation=Vertical", "COMPONENT", [node("Media")]),
    ]),
  ]);
}

test("repeated updates preserve component and child identity, external instances and added content", async () => {
  const target = board();
  target.x = 500;
  const card = target.children[0].children[0];
  const media = card.children[0];
  const instance = { mainComponent: card, overrides: { label: "Custom" } };
  const note = node("User note");
  target.children.push(note);
  const source = board();
  const incoming = source.children[0].children[0].children[0];
  incoming.width = 320;
  incoming.primaryAxisSizingMode = "FIXED";
  incoming.layoutAlign = "STRETCH";
  const ids = [card.id, media.id];
  await updateGeneratedBoard(target, source);
  await updateGeneratedBoard(target, source);
  assert.equal(target.children.length, 2);
  assert.equal(target.children[1], note);
  assert.equal(instance.mainComponent, card);
  assert.deepEqual(instance.overrides, { label: "Custom" });
  assert.deepEqual([card.id, media.id], ids);
  assert.equal(card.children[0], media);
  assert.equal(media.width, 320);
  assert.equal(media.layoutAlign, "STRETCH");
  assert.equal(media.primaryAxisSizingMode, "FIXED");
  assert.equal(target.x, 500);
});

test("unmatched or ambiguous layers abort before changing the board", async () => {
  for (const ambiguous of [false, true]) {
    const target = board();
    const media = target.children[0].children[0].children[0];
    if (ambiguous) target.children[0].children[0].children.push(node("Media"));
    else media.name = "Renamed media";
    const source = board();
    source.width = 700;
    await assert.rejects(updateGeneratedBoard(target, source), /Cannot uniquely match/);
    assert.equal(target.width, 100);
  }
});

test("an API write failure restores earlier changes", async () => {
  const target = board();
  const source = board();
  source.width = 700;
  const media = target.children[0].children[0].children[0];
  let fail = true;
  media.resizeWithoutConstraints = function (width, height) {
    if (fail) {
      fail = false;
      throw new Error("API write failed");
    }
    this.width = width;
    this.height = height;
  };
  await assert.rejects(updateGeneratedBoard(target, source), /API write failed/);
  assert.equal(target.width, 100);
  assert.equal(media.width, 100);
});

test("failed appearance verification restores component properties", async () => {
  const target = board();
  const source = board();
  source.width = 700;
  await assert.rejects(
    updateGeneratedBoard(target, source, () => {
      throw new Error("Colour mismatch");
    }),
    /Colour mismatch/,
  );
  assert.equal(target.width, 100);
});

test("bound corner radii stay linked to the variable collection", async () => {
  const target = node("Board");
  const source = node("Board");
  for (const item of [target, source]) {
    item.cornerRadius = 8;
    item.topLeftRadius = item.topRightRadius = item.bottomLeftRadius = item.bottomRightRadius = 8;
    item.boundVariables = { cornerRadius: { type: "VARIABLE_ALIAS", id: "radius" } };
    item.setBoundVariable = function (key, variable) {
      this.boundVariables[key] = variable ? { type: "VARIABLE_ALIAS", id: variable.id } : undefined;
    };
  }
  await updateGeneratedBoard(target, source);
  for (const key of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
    assert.equal(target.boundVariables[key].id, "radius");
  }
});

test("target selection prefers the active generated page and otherwise the last generated page", () => {
  const managedBoard = () => ({ type: "FRAME", getPluginData: () => "pilot", findAll: () => [{}] });
  const first = { children: [managedBoard()] };
  const last = { children: [managedBoard()] };
  const unrelated = { children: [] };
  for (const page of [first, last, unrelated])
    page.findAll = (predicate) => page.children.filter(predicate);
  globalThis.figma.root = { children: [first, last, unrelated] };
  globalThis.figma.currentPage = first;
  assert.equal(generatedTarget("pilot").page, first);
  globalThis.figma.currentPage = unrelated;
  assert.equal(generatedTarget("pilot").page, last);
  assert.equal(generatedTarget("another-plugin"), undefined);
});
