/* global figma */

export function generatedTarget(exportKey) {
  const candidates = [];
  for (const page of figma.root.children) {
    const boards = page.findAll(
      (node) => node.type === "FRAME" && node.getPluginData("invisible-ui-export") === exportKey,
    );
    for (const board of boards) {
      candidates.push({ page, board });
    }
  }
  const current = candidates.filter((candidate) => candidate.page === figma.currentPage);
  if (current.length > 1)
    throw new Error(
      "Multiple generated boards on this page. Keep one target board per page before updating.",
    );
  return (
    candidates.reverse().find((candidate) => candidate.page === figma.currentPage) ?? candidates[0]
  );
}

const SYNC_PROPERTIES = [
  "fills",
  "strokes",
  "strokeWeight",
  "strokeAlign",
  "cornerRadius",
  "effects",
  "opacity",
  "clipsContent",
  "layoutMode",
  "itemSpacing",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "fontName",
  "fontSize",
  "characters",
  "lineHeight",
  "letterSpacing",
  "textAlignHorizontal",
  "textAlignVertical",
  "textDecoration",
];
const SYNC_SIZING = [
  "primaryAxisSizingMode",
  "counterAxisSizingMode",
  "textAutoResize",
  "layoutAlign",
  "layoutGrow",
];

function nodeState(node) {
  const values = {};
  for (const key of [...SYNC_PROPERTIES, ...SYNC_SIZING]) {
    if (!(key in node)) continue;
    if (typeof node[key] === "symbol")
      throw new Error(`Mixed styles in "${node.name}" need manual review before updating.`);
    values[key] = node[key];
  }
  const bindings = {};
  const corners =
    "topLeftRadius" in node
      ? ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]
      : ["cornerRadius"];
  for (const key of corners) {
    if (key in node)
      bindings[key] = node.boundVariables?.[key] ?? node.boundVariables?.cornerRadius ?? null;
  }
  return {
    name: node.name,
    values,
    bindings,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
  };
}

function applyNodeState(node, state, preservePosition = false, boundVariables = new Map()) {
  for (const key of SYNC_PROPERTIES) {
    if (Object.hasOwn(state.values, key)) node[key] = state.values[key];
  }
  // Updating text can rename its layer. Keep the name used for matching on the next run.
  node.name = state.name;
  node.resizeWithoutConstraints(state.width, state.height);
  for (const key of SYNC_SIZING) {
    if (Object.hasOwn(state.values, key)) node[key] = state.values[key];
  }
  for (const [key, alias] of Object.entries(state.bindings)) {
    node.setBoundVariable(key, alias ? boundVariables.get(alias.id) : null);
  }
  if (!preservePosition) {
    node.x = state.x;
    node.y = state.y;
  }
}

function updatePlan(target, source, plan = []) {
  if (target.type !== source.type)
    throw new Error(`Layer type changed for "${source.name}". Update cancelled.`);
  plan.push({ target, before: nodeState(target), after: nodeState(source) });
  if (!("children" in source)) return plan;
  const used = new Set();
  for (const child of source.children) {
    const matches = target.children.filter(
      (candidate) =>
        !used.has(candidate.id) && candidate.name === child.name && candidate.type === child.type,
    );
    if (matches.length !== 1)
      throw new Error(
        `Cannot uniquely match "${child.name}" in "${target.name}". Update cancelled.`,
      );
    used.add(matches[0].id);
    updatePlan(matches[0], child, plan);
  }
  return plan;
}

export async function updateGeneratedBoard(target, source, verify = () => {}) {
  // Validate the whole tree before touching existing nodes. Their IDs keep instances connected.
  const plan = updatePlan(target, source);
  const fonts = new Map();
  const boundVariables = new Map();
  for (const item of plan) {
    for (const state of [item.before, item.after]) {
      const font = state.values.fontName;
      if (font) fonts.set(JSON.stringify(font), font);
      for (const alias of Object.values(state.bindings)) {
        if (!alias || boundVariables.has(alias.id)) continue;
        const variable = await figma.variables.getVariableByIdAsync(alias.id);
        if (!variable) throw new Error(`Variable ${alias.id} is unavailable. Update cancelled.`);
        boundVariables.set(alias.id, variable);
      }
    }
  }
  await Promise.all([...fonts.values()].map((font) => figma.loadFontAsync(font)));
  try {
    for (const item of plan)
      applyNodeState(item.target, item.after, item.target === target, boundVariables);
    await verify();
  } catch (error) {
    const failures = [];
    for (const item of plan) {
      try {
        applyNodeState(item.target, item.before, item.target === target, boundVariables);
      } catch (restoreError) {
        failures.push(restoreError);
      }
    }
    if (failures.length)
      throw new Error(`Update failed. Use Undo to restore the previous layout. ${error.message}`);
    throw error;
  }
}
