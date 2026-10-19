import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { updateTokenVariables } from "../tools/figma-component-pilot/tokens.js";
import { tokenPayload } from "./generate-figma-components.mjs";

const source = JSON.parse(
  readFileSync(new URL("../packages/tokens/tokens.json", import.meta.url), "utf8"),
);

test("bundled token values come from the canonical source in both modes", () => {
  const payload = tokenPayload(source);
  assert.deepEqual(Object.keys(payload.Light), Object.keys(payload.Dark));
  const background = "components/general/background/default";
  assert.equal(payload.Light[background].alias, "colors/palette/grey/0");
  assert.equal(payload.Dark[background].alias, "colors/palette/grey/900");
  assert.equal(payload.Light["metrics/radius/control"].type, "FLOAT");
  assert.equal(payload.Light["components/button/radius"].alias, "metrics/radius/control");
});

test("token updates retain variable IDs and mode IDs across repeated runs", async () => {
  const collection = {
    id: "collection",
    name: "Invisible UI",
    modes: [
      { name: "Light", modeId: "light" },
      { name: "Dark", modeId: "dark" },
    ],
  };
  const variables = [];
  function createVariable(name, owner, type) {
    const variable = {
      id: String(variables.length),
      name,
      variableCollectionId: owner.id,
      resolvedType: type,
      valuesByMode: {},
      setValueForMode(mode, value) {
        this.valuesByMode[mode] = value;
      },
    };
    variables.push(variable);
    return variable;
  }
  const color = createVariable("palette/test", collection, "COLOR");
  const untouched = createVariable("custom", collection, "FLOAT");
  untouched.setValueForMode("light", 42);
  globalThis.figma = {
    variables: {
      getLocalVariableCollectionsAsync: async () => [collection],
      getLocalVariablesAsync: async () => variables,
      createVariable,
    },
  };
  const mode = {
    "palette/test": { type: "COLOR", value: { r: 1, g: 1, b: 1, a: 1 } },
    role: { type: "COLOR", alias: "palette/test" },
  };
  const payload = { Light: mode, Dark: mode };
  await updateTokenVariables(payload, "Invisible UI");
  await updateTokenVariables(payload, "Invisible UI");
  assert.equal(variables.length, 3);
  assert.equal(variables[0], color);
  assert.equal(variables[2].valuesByMode.dark.id, color.id);
  assert.equal(untouched.valuesByMode.light, 42);
  color.resolvedType = "FLOAT";
  await assert.rejects(updateTokenVariables(payload, "Invisible UI"), /Variable type changed/);
});

test("the plugin waits for a choice and dispatches only the requested work", async () => {
  const calls = [];
  const figma = { showUI: () => calls.push("ui"), ui: {}, closePlugin: () => calls.push("close") };
  const code = readFileSync(
    new URL("../tools/figma-component-pilot/code.js", import.meta.url),
    "utf8",
  );
  runInNewContext(
    `${code}\nmain = async () => calls.push('components'); updateTokenVariables = async () => calls.push('tokens');`,
    { figma, __html__: "", calls },
  );
  assert.deepEqual(calls, ["ui"]);
  await figma.ui.onmessage({ type: "update", includeTokens: false });
  assert.deepEqual(calls, ["ui", "components"]);
  await figma.ui.onmessage({ type: "update", includeTokens: true });
  assert.deepEqual(calls, ["ui", "components", "tokens", "components"]);
  await figma.ui.onmessage({ type: "update", includeTokens: "true" });
  assert.equal(calls.length, 4);
  await figma.ui.onmessage({ type: "cancel" });
  assert.equal(calls[4], "close");
});

test("a token write failure restores previously updated values", async () => {
  const collection = {
    id: "collection",
    name: "Invisible UI",
    modes: [
      { name: "Light", modeId: "light" },
      { name: "Dark", modeId: "dark" },
    ],
  };
  let fail = true;
  const variable = {
    id: "v",
    name: "test",
    resolvedType: "FLOAT",
    variableCollectionId: "collection",
    valuesByMode: { light: 1, dark: 2 },
    setValueForMode(mode, value) {
      if (mode === "dark" && fail) {
        fail = false;
        throw new Error("write failed");
      }
      this.valuesByMode[mode] = value;
    },
  };
  globalThis.figma = {
    variables: {
      getLocalVariableCollectionsAsync: async () => [collection],
      getLocalVariablesAsync: async () => [variable],
    },
  };
  await assert.rejects(
    updateTokenVariables(
      { Light: { test: { type: "FLOAT", value: 3 } }, Dark: { test: { type: "FLOAT", value: 4 } } },
      "Invisible UI",
    ),
    /write failed/,
  );
  assert.deepEqual(variable.valuesByMode, { light: 1, dark: 2 });
});
