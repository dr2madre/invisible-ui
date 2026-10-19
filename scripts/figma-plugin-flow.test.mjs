import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { verifyButtonColors } from "../tools/figma-component-pilot/button-colors.js";
import { extractButtonStyles } from "./generate-figma-components.mjs";

function environment() {
  let nextId = 0;
  function node(type) {
    const data = new Map();
    const value = {
      id: String(++nextId),
      type,
      name: type,
      children: [],
      parent: null,
      removed: false,
      width: 100,
      height: 40,
      x: 0,
      y: 0,
      fills: [],
      strokes: [],
      visible: true,
      appendChild(child) {
        if (child.parent)
          child.parent.children = child.parent.children.filter((item) => item !== child);
        this.children.push(child);
        child.parent = this;
      },
      remove() {
        for (const child of [...this.children]) child.remove();
        if (this.parent)
          this.parent.children = this.parent.children.filter((item) => item !== this);
        this.removed = true;
      },
      findAll(predicate) {
        return this.children.flatMap((child) => [
          ...(predicate(child) ? [child] : []),
          ...child.findAll(predicate),
        ]);
      },
      resize(width, height) {
        this.width = width;
        this.height = height;
      },
      resizeWithoutConstraints(width, height) {
        this.resize(width, height);
      },
      setPluginData(key, content) {
        data.set(key, content);
      },
      getPluginData(key) {
        return data.get(key) ?? "";
      },
      setBoundVariable() {},
    };
    if (type === "TEXT") {
      Object.defineProperty(value, "characters", {
        get() {
          return this.text ?? "";
        },
        set(text) {
          this.text = text;
          this.name = text;
        },
      });
    }
    return value;
  }
  const page = node("PAGE");
  page.name = "My design";
  const root = node("DOCUMENT");
  root.appendChild(page);
  const errors = [];
  const variableList = [];
  const collection = {
    name: "Invisible UI",
    id: "collection",
    modes: [
      { name: "Light", modeId: "light" },
      { name: "Dark", modeId: "dark" },
    ],
  };
  const figma = {
    root,
    currentPage: page,
    ui: { postMessage: (message) => errors.push(message) },
    showUI() {},
    closePlugin() {},
    loadFontAsync: async () => {},
    viewport: { scrollAndZoomIntoView() {} },
    variables: {
      getLocalVariableCollectionsAsync: async () => [collection],
      getLocalVariablesAsync: async () => variableList,
      createVariable(name, owner, type) {
        const variable = {
          id: `variable-${variableList.length}`,
          name,
          resolvedType: type,
          variableCollectionId: owner.id,
          valuesByMode: {},
          setValueForMode(mode, value) {
            this.valuesByMode[mode] = value;
          },
        };
        variableList.push(variable);
        return variable;
      },
      setBoundVariableForPaint(paint, field, variable) {
        return {
          ...paint,
          opacity: variable.valuesByMode.light.a,
          boundVariables: { [field]: { type: "VARIABLE_ALIAS", id: variable.id } },
        };
      },
    },
    combineAsVariants(components, parent) {
      const set = node("COMPONENT_SET");
      parent.appendChild(set);
      for (const component of components) set.appendChild(component);
      return set;
    },
  };
  for (const [method, type] of [
    ["createFrame", "FRAME"],
    ["createText", "TEXT"],
    ["createComponent", "COMPONENT"],
  ]) {
    figma[method] = () => {
      const created = node(type);
      page.appendChild(created);
      return created;
    };
  }
  // Page creation and page switching are deliberately absent from this API fixture.
  const code = readFileSync(
    new URL("../tools/figma-component-pilot/code.js", import.meta.url),
    "utf8",
  );
  runInNewContext(code, { figma, __html__: "", console: { error() {} } });
  return { figma, page, errors, node, variableList, collection };
}

function buttonStyles() {
  const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  return extractButtonStyles(
    read("../packages/svelte/src/lib/button/Button.svelte"),
    JSON.parse(read("../packages/tokens/tokens.json")),
  );
}

test("components only stops when the exported Button tokens are missing", async () => {
  const { figma, page, errors } = environment();
  await figma.ui.onmessage({ type: "update", includeTokens: false });
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Missing token variable components\/button\//);
  assert.deepEqual(page.children, []);
});

test("full plugin flow updates twice without creating pages or replacing existing nodes", async () => {
  const { figma, page, errors, node } = environment();
  const run = () => figma.ui.onmessage({ type: "update", includeTokens: false });
  await figma.ui.onmessage({ type: "update", includeTokens: true });
  assert.deepEqual(errors, []);
  const board = page.children[0];
  const buttons = board.findAll(
    (item) => item.type === "COMPONENT_SET" && item.name === "Button",
  )[0];
  for (const button of buttons.children) {
    const variant = button.name.match(/Variant=([^,]+)/)[1];
    assert.equal(button.children.find((item) => item.name === "Label").characters, variant);
  }
  const ids = board.findAll(() => true).map((item) => item.id);
  const component = board.findAll((item) => item.type === "COMPONENT")[0];
  const instance = node("INSTANCE");
  instance.mainComponent = component;
  page.appendChild(instance);
  const wrapper = node("FRAME");
  page.appendChild(wrapper);
  wrapper.appendChild(board);
  for (let attempt = 0; attempt < 2; attempt++) {
    await run();
    assert.deepEqual(errors, []);
    assert.equal(figma.root.children.length, 1);
    assert.equal(figma.currentPage, page);
    assert.equal(board.parent, wrapper);
    assert.equal(board.removed, false);
    assert.deepEqual(
      board.findAll(() => true).map((item) => item.id),
      ids,
    );
    assert.equal(instance.mainComponent, component);
    assert.deepEqual(page.children, [instance, wrapper]);
  }
});

test("failed full update removes only temporary nodes and preserves the original page", async () => {
  const { figma, page, errors } = environment();
  const run = () => figma.ui.onmessage({ type: "update", includeTokens: false });
  await figma.ui.onmessage({ type: "update", includeTokens: true });
  const board = page.children[0];
  const card = board.findAll((item) => item.type === "COMPONENT_SET" && item.name === "Card")[0];
  card.name = "Renamed by user";
  const ids = board.findAll(() => true).map((item) => item.id);
  await run();
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Cannot uniquely match/);
  assert.deepEqual(page.children, [board]);
  assert.equal(figma.currentPage, page);
  assert.deepEqual(
    board.findAll(() => true).map((item) => item.id),
    ids,
  );
  assert.equal(card.name, "Renamed by user");
});

test("the verifier rejects missing borders, wrong Ghost colours and state regressions", async () => {
  const { figma, page, errors, variableList, collection } = environment();
  await figma.ui.onmessage({ type: "update", includeTokens: true });
  assert.deepEqual(errors, []);
  const appearance = JSON.parse(
    readFileSync(
      new URL("../tools/figma-component-pilot/button-appearance.json", import.meta.url),
      "utf8",
    ),
  );
  const variables = new Map(variableList.map((variable) => [variable.name, variable]));
  const board = page.children[0];
  const styles = buttonStyles();
  const verify = () => verifyButtonColors(board, appearance, variables, collection, styles);
  assert.equal(verify(), 30);
  const secondary = board.findAll(
    (item) => item.type === "COMPONENT" && item.name === "Variant=Secondary, State=Default",
  )[0];
  const strokes = secondary.strokes;
  secondary.strokes = [];
  assert.throws(verify, /solid paint/);
  secondary.strokes = strokes;
  const background = secondary.fills;
  secondary.fills = [
    {
      ...background[0],
      boundVariables: {
        color: { id: variables.get("components/button/background/primary/default").id },
      },
    },
  ];
  assert.throws(verify, /not bound to components\/button\/background\/secondary\/default/);
  secondary.fills = background;
  const ghost = variables.get("components/button/background/ghost/default");
  const saved = ghost.valuesByMode.light;
  ghost.valuesByMode.light = { r: 0.5, g: 0.5, b: 0.5, a: 1 };
  assert.throws(verify, /ghost\/default\/light\/background/);
  ghost.valuesByMode.light = saved;
  secondary.opacity = 0.5;
  assert.throws(verify, /opacity/);
  secondary.opacity = 1;
  const ghostNode = board.findAll(
    (item) => item.type === "COMPONENT" && item.name === "Variant=Ghost, State=Default",
  )[0];
  ghostNode.children.find((item) => item.name === "Label").textDecoration = "NONE";
  assert.throws(verify, /text decoration/);
});
