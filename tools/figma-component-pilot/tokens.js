/* global figma */

export async function updateTokenVariables(payload, collectionName) {
  const collections = (await figma.variables.getLocalVariableCollectionsAsync()).filter(
    (item) => item.name === collectionName,
  );
  if (collections.length > 1)
    throw new Error(
      `Multiple collections named ${collectionName}. Rename duplicates before updating.`,
    );
  let collection = collections[0];
  const existing = collection
    ? (await figma.variables.getLocalVariablesAsync()).filter(
        (item) => item.variableCollectionId === collection.id,
      )
    : [];
  const byName = new Map();
  for (const variable of existing) {
    if (byName.has(variable.name)) throw new Error(`Duplicate variable: ${variable.name}`);
    byName.set(variable.name, variable);
  }
  for (const [name, token] of Object.entries(payload.Light)) {
    if (byName.has(name) && byName.get(name).resolvedType !== token.type)
      throw new Error(`Variable type changed: ${name}. Update cancelled.`);
  }
  if (collection) {
    for (const name of ["Light", "Dark"]) {
      if (collection.modes.filter((mode) => mode.name === name).length > 1)
        throw new Error(`Duplicate mode: ${name}`);
    }
    if (!collection.modes.some((mode) => mode.name === "Light"))
      throw new Error("Rename the existing light mode to Light before updating tokens.");
  }
  const newCollection = !collection;
  const createdVariables = [];
  const createdModes = [];
  const previous = [];
  try {
    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
      collection.renameMode(collection.defaultModeId, "Light");
    }
    const modes = {};
    for (const name of ["Light", "Dark"]) {
      modes[name] = collection.modes.find((mode) => mode.name === name)?.modeId;
      if (!modes[name]) {
        modes[name] = collection.addMode(name);
        createdModes.push(modes[name]);
      }
    }
    for (const [name, token] of Object.entries(payload.Light)) {
      if (!byName.has(name)) {
        const variable = figma.variables.createVariable(name, collection, token.type);
        createdVariables.push(variable);
        byName.set(name, variable);
      }
    }
    for (const [mode, tokens] of Object.entries(payload)) {
      for (const [name, token] of Object.entries(tokens)) {
        const variable = byName.get(name);
        const value = token.alias
          ? { type: "VARIABLE_ALIAS", id: byName.get(token.alias).id }
          : token.value;
        previous.push({ variable, mode: modes[mode], value: variable.valuesByMode[modes[mode]] });
        variable.setValueForMode(modes[mode], value);
      }
    }
  } catch (error) {
    try {
      if (newCollection && collection) collection.remove();
      else {
        for (const item of previous.reverse()) {
          if (!createdVariables.includes(item.variable) && !createdModes.includes(item.mode)) {
            if (item.value === undefined) item.variable.removeValueForMode(item.mode);
            else item.variable.setValueForMode(item.mode, item.value);
          }
        }
        for (const variable of createdVariables) variable.remove();
        for (const mode of createdModes) collection.removeMode(mode);
      }
    } catch {
      throw new Error(`Token update failed. Use Undo to restore the collection. ${error.message}`);
    }
    throw error;
  }
}
